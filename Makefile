PREV_VERSION = $(shell grep '^__version__' src/flutterbug_server/__init__.py | sed 's/.*"\(.*\)"/\1/')

# BSD sed (macOS) requires an explicit empty backup suffix; GNU sed (Linux) does not accept it.
ifeq ($(shell uname),Darwin)
SED_INPLACE = sed -i ''
else
SED_INPLACE = sed -i
endif

.PHONY: clean dev prerelease release

clean:
	rm -rf flutterbug-windows.zip dist/ build/ src/*.egg-info
	find . -name '__pycache__' -exec rm -rf {} + 2>/dev/null; true
	find . -name '.pytest_cache' -exec rm -rf {} + 2>/dev/null; true

dev:
	pip install -e .

# Run before `make release`. Wipes node_modules so npm fetches the latest
# asyncglk from GitHub (the package.json dep is unpinned), then builds the
# browser bundle. Test the result manually -- `make release` uses whatever
# is currently in node_modules, so the version you tested is the version
# that ships.
prerelease:
	rm -rf node_modules
	npm install
	npm run build
	@echo
	@echo "Build complete. Test with the freshly-built bundle (e.g."
	@echo "    flutterbug --no-password --open --story=PATH"
	@echo "). When you're satisfied, run: make release VERSION=X.Y"

release:
ifndef VERSION
	$(error VERSION is required: make release VERSION=0.96)
endif
	npm run build
	$(SED_INPLACE) 's/__version__ = "$(PREV_VERSION)"/__version__ = "$(VERSION)"/' \
		src/flutterbug_server/__init__.py
	$(SED_INPLACE) 's/@v$(PREV_VERSION)/@v$(VERSION)/g' readme.md
	$(SED_INPLACE) 's/@v$(PREV_VERSION)/@v$(VERSION)/g' windows/flutterbug-install.bat
	git add src/flutterbug_server/__init__.py readme.md windows/flutterbug-install.bat \
		src/flutterbug_server/static/play.bundle.js \
		src/flutterbug_server/static/asyncglk-css
	git commit -m "Release $(VERSION)"
	git tag v$(VERSION)
	git push origin main
	git push origin v$(VERSION)
	zip -j flutterbug-windows.zip windows/*
	gh release create v$(VERSION) \
		--title "v$(VERSION)" \
		--prerelease \
		--generate-notes \
		flutterbug-windows.zip
	rm flutterbug-windows.zip
