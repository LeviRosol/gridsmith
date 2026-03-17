# GridSmith – Project Context for Cursor

## Overview

GridSmith is a web-based tool for generating modular, 3D-printable terrain **base grids** for tabletop RPGs (TTRPGs).

The first goal is **not** to generate terrain tiles themselves. The initial product is a **baseplate generator** that lets users configure a grid and export an STL for 3D printing. Terrain tiles and heightmap-based tile generation are future phases.

Brand concept:
> GridSmith – Build Your World. One Tile at a Time.

---

## Repository / Starting Point

This project is being built from a fork of the **OpenSCAD Playground** repository.

### Current repo
- GitHub fork: `LeviRosol/gridsmith`

### Intent
Use the OpenSCAD Playground as the technical foundation and evolve it into a **GridSmith baseplate generator**.

This means:
- retain the **client-side OpenSCAD WASM** architecture
- retain the browser-based generation model
- simplify the UX from a general SCAD playground into a **focused product UI**
- replace the generic editor-first workflow with a **parameter-driven generator**
- keep STL generation and preview entirely in-browser

The OpenSCAD Playground is the blueprint and starting scaffold, not just inspiration.

---

## Product Goal (v1)

Build **gridsmith.io** as a client-side baseplate generator that allows users to:

- configure a modular terrain base grid
- preview the model in 3D
- generate/export an STL

The generated object is a **baseplate** that holds modular terrain tiles.

This should feel similar to a Gridfinity-style generator:
- a few adjustable values
- a live or semi-live preview
- downloadable STL output

---

## Critical Technical Direction

I want this built in the style of the **OpenSCAD browser playground/demo**:
- **completely client-side**
- no backend required for geometry generation
- OpenSCAD compiled to **WASM** in the browser
- parameter-driven UI that generates SCAD code under the hood
- browser-based 3D preview
- browser-based STL export

This is a key requirement for the project.

### Intended flow

```text
User Inputs
    ↓
Generate SCAD string in browser
    ↓
Run OpenSCAD WASM in browser
    ↓
Generate mesh / STL in browser
    ↓
Preview in browser
    ↓
Download STL
````

No server-side rendering should be assumed for v1.

---

## What the Baseplate Is

The baseplate is a grid of square cells designed to accept separate terrain tiles.

Each baseplate includes:

* configurable rows and columns
* configurable cell size
* internal wall structure between cells
* reduced-size exterior wall thickness
* a thin underlay beneath wall lines only
* internal shelf ledges inside each cell to support tiles
* configurable clearance gap for tuning fit

The goal is to make the baseplate:

* strong enough to be practical
* light enough to print efficiently
* simple enough to generate quickly in-browser

---

## Current Geometry Source of Truth

The current working generator is an OpenSCAD script.

### Existing OpenSCAD Script

```scad
// Adjustable size cell baseplate with wall-only underlay + internal shelves for tiles
// Adjust rows/cols for different plate sizes (e.g., 3x3, 4x1, 4x2)
rows = 2;
cols = 2;

cell = 30.5;            // cell size (mm)
wall = 1;               // interior wall thickness between cells (mm)
ext_wall_pct = 0.5;     // exterior wall percent compared to interior wall
height = 2;             // total wall height (mm)
underlay_thick = 0.6;   // thickness of material under walls only (mm)
gap = 0.2;              // clearance per side inside each cell (tune for fit)

// Shelf parameters (tile support ledge inside each cell)
shelf_height = 1.0;    // distance below top surface where shelf sits (mm)
shelf_width  = 1.0;    // radial width of shelf from wall inward (mm)
shelf_thick  = 1.6;    // thickness of the shelf rib (mm)

// Derived dimensions
plate_w = cols*cell + (cols+1)*wall-(wall*ext_wall_pct);  // outer width
plate_d = rows*cell + (rows+1)*wall-(wall*ext_wall_pct);  // outer depth
inner_cell = cell - 2*gap;            // interior opening after gap

module baseplate() {
  difference() {
    // Main block + underlay ribs
    union() {
      cube([plate_w, plate_d, height], center=false);
      // Underlay ribs beneath all walls
      translate([0, 0, -underlay_thick])
        walls_2d_extrude(underlay_thick);

      // Add shelves inside each cell
      shelves();
    }

    // Hollow out cell interiors (down through shelves where appropriate)
    for (r = [0:rows-1])
      for (c = [0:cols-1]) {
        translate([
          wall + c*(cell + wall) + gap,
          wall + r*(cell + wall) + gap,
          0
        ])
        cube([inner_cell, inner_cell, height + underlay_thick + 1], center=false);
      }
  }
}

// Shelves: thin ledges inset from each wall, at shelf_height below top
module shelves() {
  z = height - shelf_height - shelf_thick; // bottom of shelf rib
  for (r = [0:rows-1])
    for (c = [0:cols-1]) {
      // Cell inner corner
      x0 = wall + c*(cell + wall) + gap;
      y0 = wall + r*(cell + wall) + gap;

      // Shelf outer rectangle follows the cell opening boundary
      // We subtract an inner rectangle to make the shelf only shelf_width deep
      difference() {
        translate([x0, y0, z])
          cube([inner_cell, inner_cell, shelf_thick], center=false);

        // Inner cutout to leave a perimeter ring (the actual shelf)
        translate([x0 + shelf_width, y0 + shelf_width, z - 0.1])
          cube([inner_cell - 2*shelf_width, inner_cell - 2*shelf_width,
                shelf_thick + 0.2], center=false);
      }
    }
}

// 2D wall layout extruded to create the underlay ribs
module walls_2d_extrude(th) {
  linear_extrude(th)
    walls_2d();
}

module walls_2d() {
  difference() {
    // Outer boundary
    square([plate_w, plate_d], center=false);

    // Subtract openings for each cell (leaving only walls)
    for (r = [0:rows-1])
      for (c = [0:cols-1]) {
        translate([
          wall + c*(cell + wall) + gap,
          wall + r*(cell + wall) + gap
        ])
        square([inner_cell, inner_cell], center=false);
      }
  }
}

baseplate();
```

---

## What This Script Produces

The script creates a printable base grid with:

* outer perimeter walls
* internal walls between cells
* a shallow underlay only beneath the wall structure
* a hollow interior per cell
* a support shelf ring inside each cell

This is intended to support thin terrain tiles that drop into each cell.

---

## What Needs To Change in the Fork

The OpenSCAD Playground is currently a general-purpose SCAD playground. GridSmith v1 should reshape it into a focused product.

### High-level transformation

Move from:

* code editor first
* generic CAD playground
* user writes arbitrary SCAD

To:

* productized parameter panel
* hidden/generated SCAD
* focused baseplate generator
* simple preview + export workflow

### Desired product behavior

The user should not need to write SCAD.

Instead, the user:

1. picks grid parameters
2. sees preview
3. generates STL
4. downloads STL

---

## Technical Direction

The initial site should be focused only on the baseplate generator.

### Desired user flow

1. User enters dimensions/settings
2. Browser generates SCAD source from those settings
3. OpenSCAD WASM runs in the browser
4. User sees a preview
5. User downloads STL

### Hard requirement

This should be built as a **browser-native OpenSCAD app**, based on the Playground fork, not a server-rendered CAD service.

---

## Suggested Stack

### Existing foundation

* OpenSCAD Playground fork
* client-side OpenSCAD WASM
* browser-based rendering/export pipeline

### App layer to build on top

* **React / Next.js** if appropriate inside the fork structure, or preserve the existing app architecture if the fork already provides the needed shell
* **TypeScript**
* **Three.js** for 3D preview
* Tailwind or existing styling system, depending on repo structure

### Geometry generation

* OpenSCAD WASM in the browser
* SCAD source generated dynamically from UI values
* No backend required for model generation in v1

### Export

* STL generation/export in browser

---

## Key Parameters to Expose in the UI

### Basic settings

* `rows`
* `cols`
* `cell`
* `gap`

### Advanced settings

* `wall`
* `ext_wall_pct`
* `height`
* `underlay_thick`
* `shelf_height`
* `shelf_width`
* `shelf_thick`

Likely UX:

* simple mode for most users
* advanced settings collapsible

---

## Suggested Parameter Labels for UI

* Rows
* Columns
* Cell Size (mm)
* Fit Tolerance / Gap (mm)
* Interior Wall Thickness (mm)
* Exterior Wall Scale
* Base Height (mm)
* Underlay Thickness (mm)
* Shelf Height (mm)
* Shelf Width (mm)
* Shelf Thickness (mm)

---

## Immediate Refactor Goals for the SCAD Script

The script works, but should be cleaned up for web integration.

### Refactor goals

1. Separate **public parameters** from **derived values**
2. Improve naming clarity
3. Make the script easier to template from code
4. Keep geometry behavior unchanged

### Example naming improvements

* `ext_wall_pct` → `ext_wall_scale`
* `height` → `plate_height`
* `cell` → `cell_size`

Do not change behavior yet unless necessary.

---

## Recommended SCAD Structure After Refactor

### Section 1: public config

Values injected by the web app

### Section 2: derived dimensions

Computed values only

### Section 3: geometry modules

* `baseplate()`
* `shelves()`
* `walls_2d()`
* `walls_2d_extrude()`

### Section 4: final call

* `baseplate();`

---

## Product UX Direction

### Desired v1 layout

A simplified app with:

* parameter controls on one side
* 3D preview on the other
* generate/download actions
* optional presets

### Left panel

Controls:

* Rows
* Columns
* Cell Size
* Gap
* Advanced settings accordion
* Presets
* Generate / Download button

### Right panel

3D preview:

* orbit controls
* responsive render area
* maybe dimensions displayed below

### Remove or de-emphasize

* raw SCAD editing as the primary workflow
* generic playground concepts
* anything that makes the product feel like a dev tool instead of a user tool

The SCAD editor can remain available internally or as an advanced/debug panel, but it should not be the main experience.

---

## Preview Goals

The preview does not need to be perfect CAD-level accuracy at first.

It should:

* show the generated plate
* allow orbit/pan/zoom
* reflect the user’s chosen parameters

The preview should stay entirely client-side.

---

## Performance Priorities

Because this v1 is only the baseplate generator, performance should be much better than heightmap-based tile generation.

Still, the project should prioritize:

* fast browser generation
* predictable STL exports
* responsive UI
* no unnecessary geometry complexity

The project should be designed with browser performance in mind since all computation happens client-side.

---

## Product Strategy

### Initial release

A focused baseplate generator:

* free or low-friction to use
* validates interest
* useful on its own

### Later expansion

Potential future products:

* terrain tile packs sold separately (likely Patreon)
* tile generator
* wall tiles
* themed terrain sets

For now, **do not build the tile generator** into the site.

---

## Brand Positioning

GridSmith is a modular terrain platform for tabletop gaming.

The v1 site should present GridSmith as:

* a tool for generating terrain infrastructure
* simple, useful, and print-friendly
* optimized for 3D-printed modular play

Tagline:

> Build Your World. One Tile at a Time.

---

## Development Goal for Cursor

Use Cursor to help evolve the **LeviRosol/gridsmith** fork into a focused GridSmith generator with these priorities:

1. Build a working UI for editing baseplate parameters
2. Generate OpenSCAD source from those parameters
3. Run OpenSCAD in-browser via WASM
4. Display a 3D preview in-browser
5. Export STL in-browser
6. Rework the forked playground UX into a productized generator experience
7. Keep the code clean and structured for future expansion

---

## Suggested MVP Scope

### Include

* homepage / app shell
* parameter form
* advanced settings section
* generate button
* STL output/download
* 3D preview
* presets for common sizes (2x2, 3x3, 4x4, hallway strip, etc.)
* reuse of the existing OpenSCAD Playground browser execution pipeline where practical

### Exclude for now

* terrain tiles
* user-uploaded heightmaps
* server-side rendering
* subscriptions/payments
* authentication
* large content libraries

---

## Future Roadmap (not for v1)

* tile generator
* tile libraries
* Patreon-gated tile packs
* premium export/detail options
* user-uploaded tile art / heightmaps
* multi-part scene planning

---

## Important Constraint

The initial product should stay narrow:
**GridSmith v1 = client-side base grid generator only, built from the OpenSCAD Playground fork.**

That is the current focus and should guide architecture decisions.

---

## What Cursor Should Help Produce

Cursor should help build:

* a cleaned-up product layer on top of the existing fork
* a parameter-driven baseplate generator UI
* in-browser OpenSCAD WASM integration using the existing repo foundation
* browser-based STL export
* browser-based 3D preview
* code structured for later expansion into a broader GridSmith platform

---

## First Practical Development Tasks

Suggested order:

1. Understand the forked OpenSCAD Playground architecture
2. Identify where SCAD source is passed into the browser OpenSCAD engine
3. Replace freeform SCAD-first UX with a parameter-driven baseplate form
4. Add a SCAD template generator for the baseplate script
5. Hook generated SCAD into the existing render/export pipeline
6. Build a cleaner branded UI around that flow
7. Add presets and advanced settings

---

## Important Instruction for Cursor

When making changes, prefer:

* reusing the fork’s existing client-side execution path
* reusing its STL/export infrastructure
* reusing its preview/render infrastructure

Avoid rebuilding major engine pieces unless necessary.

The main job is to **transform the fork into a specialized GridSmith product**, not to start from scratch inside the repo.

```
