// Tile builder SCAD entry — replace with your script when ready.
export default `
// GridSmith STL tile assembler
// Each position chooses a tile type, filename built from:
// <tile_type>_<resolution>.stl

// -----------------------------
// Tile set (reserved; not used in assembly yet)
// -----------------------------
tile_set = "tavern";

// -----------------------------
// Resolution
// -----------------------------
resolution = 64;

// -----------------------------
// Tile size
// -----------------------------
tile_size = 30;

// -----------------------------
// Z offsets
// -----------------------------
floor_z = 0;
wall_z = 0;

// -----------------------------
// Floor
// -----------------------------
use_floor = true;
floor_type = "floor";
floor_rotation = 0;

// none | flat | curved (UI; walls only assemble when not "none")
wall_profile = "none";

// -----------------------------
// Wall positions
// -----------------------------
use_north_wall = false;
north_wall_type = "wall";
north_wall_rotation = 0;

use_east_wall = false;
east_wall_type = "wall";
east_wall_rotation = 0;

use_south_wall = false;
south_wall_type = "wall";
south_wall_rotation = 0;

use_west_wall = false;
west_wall_type = "wall";
west_wall_rotation = 0;

// -----------------------------
// File builder
// -----------------------------
function tile_file(type_name) = str(type_name, "_", resolution, ".stl");

// -----------------------------
// Helpers
// -----------------------------
module place_stl(file, pos=[0,0,0], rot=0) {
    translate(pos)
        rotate([0, 0, rot])
            import(str("/tile_stls/", file), convexity=5);
}

function side_rotation(side) =
    side == "north" ?   0 :
    side == "east"  ? -90 :
    side == "south" ? 180 :
    side == "west"  ?  90 :
    0;

// Offsets for STL authored/exported in NORTH position.
// After rotation, these move the mesh back into tile-space.
function wall_offset(side) =
    side == "north" ? [0, 0, wall_z] :
    side == "east"  ? [0, tile_size, wall_z] :
    side == "south" ? [tile_size, tile_size, wall_z] :
    side == "west"  ? [tile_size, 0, wall_z] :
    [0, 0, wall_z];

// -----------------------------
// Assembly
// -----------------------------
module terrain_tile_from_stls() {
    union() {
        if (use_floor)
            place_stl(
                tile_file(floor_type),
                [0, 0, floor_z],
                floor_rotation
            );

        if (wall_profile != "none" && use_north_wall)
            place_stl(
                tile_file(north_wall_type),
                wall_offset("north"),
                side_rotation("north") + north_wall_rotation
            );

        if (wall_profile != "none" && use_east_wall)
            place_stl(
                tile_file(east_wall_type),
                wall_offset("east"),
                side_rotation("east") + east_wall_rotation
            );

        if (wall_profile != "none" && use_south_wall)
            place_stl(
                tile_file(south_wall_type),
                wall_offset("south"),
                side_rotation("south") + south_wall_rotation
            );

        if (wall_profile != "none" && use_west_wall)
            place_stl(
                tile_file(west_wall_type),
                wall_offset("west"),
                side_rotation("west") + west_wall_rotation
            );
    }
}

terrain_tile_from_stls();
`;
