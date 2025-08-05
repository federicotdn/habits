serve:
	python3 -m http.server 8000

format:
	npx @biomejs/biome@latest format --write *.js *.css site.webmanifest

check:
	npx @biomejs/biome@latest check *.js *.css
