## Building

The project uses a **webpack-based build system** that reads library metadata from `libs-config.json` to automatically download, clone, and package OpenSCAD libraries and dependencies. This replaces the previous Makefile approach with a more standard, maintainable solution.

Prerequisites:
*   wget or curl
*   Node.js (>=18.12.0)
*   npm
*   git
*   zip
*   Docker able to run amd64 containers (only needed if building WASM from source). If running on a different platform (including Silicon Mac), you can add support for amd64 images through QEMU with:

  ```bash
  docker run --privileged --rm tonistiigi/binfmt --install all
  ```

Local dev:

```bash
npm run build:libs  # Download WASM and build all OpenSCAD libraries
npm install
npm run start
# http://localhost:4000/
```

Local prod (test both the different inlining and serving under a prefix):

```bash
npm run build:libs  # Download WASM and build all OpenSCAD libraries
npm install
npm run start:production
# http://localhost:3000/dist/
```

Deployment (edit "homepage" in `package.json` to match your deployment root!):

```bash
npm run build:all  # Build libraries and compile the application
npm install

rm -fR ../ochafik.github.io/openscad2 && cp -R dist ../ochafik.github.io/openscad2
# Now commit and push changes, wait for site update and enjoy!
```

## Build your own WASM binary

The build system fetches a prebuilt OpenSCAD web WASM binary, but you can build your own in a couple of minutes:

- **Optional**: use your own openscad fork / branch:

  ```bash
  rm -fR libs/openscad
  ln -s $PWD/../absolute/path/to/your/openscad libs/openscad

  # If you had a native build directory, delete it.
  rm -fR libs/openscad/build
  ```

- Build WASM binary (add `WASM_BUILD=Debug` argument if you'd like to debug any cryptic crashes):

  ```bash
  npm run build:libs:wasm
  ```

- Then continue the build:

  ```bash
  npm run build:libs
  npm run start
  ```

## Adding OpenSCAD libraries

The build system uses a webpack plugin that reads from `libs-config.json` to manage all library dependencies. You'll need to update 3 files (search for BOSL2 for an example):

- [libs-config.json](./libs-config.json): to add the library's metadata including repository URL, branch, and files to include/exclude in the zip archive

- [src/fs/zip-archives.ts](./src/fs/zip-archives.ts): to use the `.zip` archive in the UI (both for file explorer and automatic imports mounting)

- [LICENSE.md](./LICENSE.md): most libraries require proper disclosure of their usage and of their license. If a license is unique, paste it in full, otherwise, link to one of the standard ones already there.

### Library Configuration Format

In `libs-config.json`, add an entry like this:

```json
{
  "name": "LibraryName",
  "repo": "https://github.com/user/repo.git",
  "branch": "main",
  "zipIncludes": ["*.scad", "LICENSE", "examples"],
  "zipExcludes": ["**/tests/**"],
  "workingDir": "."
}
```

Available build commands:
- `npm run build:libs` - Build all libraries
- `npm run build:libs:clean` - Clean all build artifacts
- `npm run build:libs:wasm` - Download/build just the WASM binary
- `npm run build:libs:fonts` - Download/build just the fonts

Send us a PR, then once it's merged request an update to the hosted https://ochafik.com/openscad2 demo.
