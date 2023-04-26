var spacing_x = 40;
var spacing_y = 100;
// Initialize Flow
jsflow(document.getElementById("canvas"), onGrab, onRelease, oncouple, onRearrange, spacing_x, spacing_y);
function onGrab(block){
	// When the user grabs a block
}
function onRelease(){
	// When the user releases a block
}

function oncouple(block, first, parent){
	// When a block snaps with another one
}

function onRearrange(block, parent){
	// When a block is rearranged
}