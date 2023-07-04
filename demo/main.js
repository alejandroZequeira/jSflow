var spacing_x = 40;
var spacing_y = 100;
var cont=0
// Initialize Flow
jsflow(document.getElementById("canvas"), onGrab, onRelease, oncouple, onRearrange, spacing_x, spacing_y);
function onGrab(block){
	
}
function onRelease(){
	// When the user releases a block
	return true
}

function oncouple(block, first, parent){
	block.innerHTML+="<p>block number: "+cont+"</p>"	
	cont++
	return true
}

function onRearrange(block, parent){
	// When a block is rearranged
	return true
}