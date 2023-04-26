var jsflow= function (canvas, grab, release, snapping, rearrange,scale, spacing_x, spacing_y, type){
    if (!grab) {
        grab = function() {};
    }
    if (!release) {
        release = function() {};
    }
    if (!snapping) {
        snapping = function() {
            return true;
        }
    }
    if (!rearrange) {
        rearrange = function() {
            return false;
        }
    }
    if (!scale) {
        rearrange = function() {
            return false;
        }
    }
    if (!spacing_x) {
        spacing_x = 20;
    }
    if (!spacing_y) {
        spacing_y = 80;
    }
    if (!type) {
        type = "tree";
    }
}