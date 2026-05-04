PREV_VERSION = $(shell grep '^__version__' src/flutterbug_server/__init__.py | sed 's/.*"\(.*\)"/\1/')

.PHONY: clean dev release

clean:
	rm -rf flutterbug-windows.zip dist/ build/ src/*.egg-info
	find . -name '__pycache__' -exec rm -rf {} + 2>/dev/null; true
	find . -name '.pytest_cache' -exec rm -rf {} + 2>/dev/null; true

dev:
	pip install -e .

release:
ifndef VERSION
	$(error VERSION is required: make release VERSION=0.96)
endif
	sed -i '' 's/__version__ = "$(PREV_VERSION)"/__version__ = "$(VERSION)"/' \
		src/flutterbug_server/__init__.py
	sed -i '' 's/@v$(PREV_VERSION)/@v$(VERSION)/g' readme.md
	sed -i '' 's/@v$(PREV_VERSION)/@v$(VERSION)/g' windows/flutterbug-install.bat
	git add src/flutterbug_server/__init__.py readme.md windows/flutterbug-install.bat
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
