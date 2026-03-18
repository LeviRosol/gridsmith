// Default baseplate SCAD program for GridSmith.
// This script is the source of truth for the v1 base grid geometry.
export default `// Adjustable size cell baseplate with wall-only underlay + internal shelves for tiles
// Adjust rows/cols for different plate sizes (e.g., 3x3, 4x1, 4x2)

// Public parameters (overridable via -Dname=value)
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
`;

