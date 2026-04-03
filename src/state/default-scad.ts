// Default baseplate SCAD program for GridSmith.
// Public parameters match the GridSmith customizer (no additional -D names).
//
// When you edit the template below, increment BASEPLATE_TEMPLATE_REVISION in ./initial-state.ts
// so URL-persisted projects reload this source instead of keeping stale embedded SCAD.
export default `// GridSmith baseplate
// Refactor goals:
// - all 4 exterior walls use the same exterior wall thickness
// - model sits fully at Z=0
// - shelf is the primary reference plane
// - wall_height means wall height ABOVE the top of the shelf
// - simplify the parameter model: ledge_thickness is the single seat-height control
// - optional snap ribs can be added inside each cell for tile retention

rows = 2;
cols = 2;

cell_size = 30.4;      // nominal cell size (mm)
wall_thickness = 1;    // interior wall thickness between cells (mm)
exterior_wall = 0.5;   // exterior wall thickness on all 4 outside edges (mm)
wall_height = 3;       // wall height ABOVE the top of the shelf (mm)
clearance = 0.0;       // clearance per side inside each cell (tune for fit)

// Shelf / tile support ledge inside each cell
ledge_width = 1.0;     // radial width of shelf from wall inward (mm)
ledge_thickness = 1.0; // thickness of the shelf rib (mm)

// Snap rib inside each cell wall
// Snap rib inside each cell wall
// rib_z_offset is measured from the TOP of the ledge to the TOP of the rib.
// The rib is then built downward from that reference.
// rib_radius rounds all exposed rib edges; keep it <= min(rib_height, rib_projection)/2.
rib_enabled = true;
rib_z_offset = 1.8;    // top of rib above the top of the ledge (mm)
rib_width = 10.0;      // length of each rib along the wall face (mm)
rib_height = 0.5;      // vertical height of the rib (mm)
rib_projection = 0.3;  // projection of the rib into the cell (mm)
rib_radius = 0.2;      // rounding radius on exposed rib edges (mm)

// Interior top roundover on wall tops only.
// Applies only to the cell-facing top wall edges.
// Exterior top edges remain sharp.
interior_top_round_radius = 0.5; // radius of top roundover on interior wall edges (mm)

// Derived dimensions
cell_opening = cell_size - 2*clearance;
pitch = cell_size + wall_thickness;
plate_width = cols*cell_size + (cols-1)*wall_thickness + 2*exterior_wall;
plate_depth = rows*cell_size + (rows-1)*wall_thickness + 2*exterior_wall;

// Single source of truth for the structural floor.
// Option A: the base thickness follows the ledge thickness so tile seat height
// is controlled by one user-facing value.
base_thickness = ledge_thickness;

// Z stack
// The ledge is the primary reference feature. The top of the wall is defined as:
//   ledge_thickness + wall_height
// Lower wall material fills from the bed up through the top of the ledge.
ledge_z0 = 0;
upper_wall_z0 = ledge_thickness;
lower_wall_height = ledge_thickness;
total_wall_top_z = ledge_thickness + wall_height;
upper_wall_chamfer_height = min(interior_top_round_radius, wall_height);
upper_wall_straight_height = wall_height - upper_wall_chamfer_height;
upper_wall_opening_offset = upper_wall_chamfer_height;
rib_z0 = ledge_thickness + rib_z_offset - rib_height;

function cell_opening_x(col) = exterior_wall + col*pitch + clearance;
function cell_opening_y(row) = exterior_wall + row*pitch + clearance;
function rib_x0(col) = cell_opening_x(col) + (cell_opening - rib_width)/2;
function rib_y0(row) = cell_opening_y(row) + (cell_opening - rib_width)/2;

// Per-side wall widths for a given cell.
function south_wall_width(row) = (row == 0) ? exterior_wall : wall_thickness;
function north_wall_width(row) = (row == rows-1) ? exterior_wall : wall_thickness;
function west_wall_width(col)  = (col == 0) ? exterior_wall : wall_thickness;
function east_wall_width(col)  = (col == cols-1) ? exterior_wall : wall_thickness;

module baseplate() {
  intersection() {
    union() {
      ledges();
      wall_shell(lower_wall_height);

      if (wall_height > 0)
        translate([0, 0, upper_wall_z0]) {
          wall_shell(upper_wall_straight_height);

          if (upper_wall_chamfer_height > 0)
            translate([0, 0, upper_wall_straight_height])
              interior_top_chamfer_cap(upper_wall_chamfer_height, upper_wall_opening_offset);
        }

      if (rib_enabled && rib_width > 0 && rib_height > 0 && rib_projection > 0)
        snap_ribs();
    }

    // Trim any geometry that extends outside the exterior footprint.
    translate([0, 0, 0])
      cube([plate_width, plate_depth, total_wall_top_z], center=false);
  }
}

module ledges() {
  for (row = [0:rows-1])
    for (col = [0:cols-1]) {
      x0 = cell_opening_x(col);
      y0 = cell_opening_y(row);

      difference() {
        translate([x0, y0, ledge_z0])
          cube([cell_opening, cell_opening, ledge_thickness], center=false);

        translate([x0 + ledge_width, y0 + ledge_width, ledge_z0 - 0.1])
          cube([
            cell_opening - 2*ledge_width,
            cell_opening - 2*ledge_width,
            ledge_thickness + 0.2
          ], center=false);
      }
    }
}


module rounded_rib(length, depth, height, radius) {
  // Ensure a valid radius for the current rib dimensions.
  r = min(radius, length/2, depth/2, height/2);

  if (r <= 0)
    cube([length, depth, height], center=false);
  else
    // Keep the rib anchored to a clean local bounding box:
    // X: [0,length], Y: [0,depth], Z: [0,height]
    translate([r, r, r])
      minkowski() {
        cube([
          max(length - 2*r, 0.001),
          max(depth - 2*r, 0.001),
          max(height - 2*r, 0.001)
        ], center=false);

        sphere(r=r, $fn=24);
      }
}

module snap_ribs() {
  // Build each rib as a single rounded object whose total depth is:
  //   actual wall width on that side + (2 * rib_projection)
  // Then center that object on the wall centerline.
  // This makes rib placement symmetric and consistent on all 4 sides.

  for (row = [0:rows-1])
    for (col = [0:cols-1]) {
      x0 = cell_opening_x(col);
      y0 = cell_opening_y(row);
      xr = rib_x0(col);
      yr = rib_y0(row);

      south_w = south_wall_width(row);
      north_w = north_wall_width(row);
      west_w  = west_wall_width(col);
      east_w  = east_wall_width(col);

      south_depth = south_w + 2*rib_projection;
      north_depth = north_w + 2*rib_projection;
      west_depth  = west_w  + 2*rib_projection;
      east_depth  = east_w  + 2*rib_projection;

      south_center_y = y0 - south_w/2;
      north_center_y = y0 + cell_opening + north_w/2;
      west_center_x  = x0 - west_w/2;
      east_center_x  = x0 + cell_opening + east_w/2;

      // South wall rib.
      translate([xr, south_center_y - south_depth/2, rib_z0])
        rounded_rib(rib_width, south_depth, rib_height, rib_radius);

      // North wall rib.
      translate([xr, north_center_y - north_depth/2, rib_z0])
        rounded_rib(rib_width, north_depth, rib_height, rib_radius);

      // West wall rib.
      translate([west_center_x - west_depth/2, yr, rib_z0])
        rounded_rib(west_depth, rib_width, rib_height, rib_radius);

      // East wall rib.
      translate([east_center_x - east_depth/2, yr, rib_z0])
        rounded_rib(east_depth, rib_width, rib_height, rib_radius);
    }
}


module cell_opening_chamfer_void(row, col, chamfer_height, opening_offset) {
  // Tapered void for a single cell opening.
  // Bottom matches the normal opening; top expands outward by opening_offset.
  x0 = cell_opening_x(col);
  y0 = cell_opening_y(row);

  hull() {
    translate([x0, y0, 0])
      linear_extrude(height = 0.001)
        square([cell_opening, cell_opening], center=false);

    translate([x0, y0, chamfer_height - 0.001])
      linear_extrude(height = 0.001)
        offset(delta = opening_offset)
          square([cell_opening, cell_opening], center=false);
  }
}

module interior_top_chamfer_cap(chamfer_height, opening_offset) {
  // Builds the top wall cap directly, with an inward chamfer on cell-facing edges only.
  // Exterior top edges remain sharp because the outer profile is a simple rectangle.
  if (chamfer_height > 0)
    difference() {
      linear_extrude(height = chamfer_height)
        square([plate_width, plate_depth], center=false);

      for (row = [0:rows-1])
        for (col = [0:cols-1])
          cell_opening_chamfer_void(row, col, chamfer_height, opening_offset);
    }
}

module wall_shell(z_height) {

  linear_extrude(z_height)
    wall_profile(0);
}

module wall_profile(opening_offset = 0) {
  difference() {
    square([plate_width, plate_depth], center=false);

    for (row = [0:rows-1])
      for (col = [0:cols-1])
        translate([cell_opening_x(col), cell_opening_y(row)])
          offset(delta = opening_offset)
            square([cell_opening, cell_opening], center=false);
  }
}

baseplate();
`;
