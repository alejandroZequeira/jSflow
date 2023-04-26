var jsflow = function (canvas, grab, release, couple, rearranging, clone, x_space, y_space, type) {
    console.log("cargo jSflow")
    if (!grab) {
        grab = function () { };
    }
    if (!release) {
        release = function () { };
    }
    if (!couple) {
        couple = function () {
            return true;
        }
    }
    if (!rearranging) {
        rearranging = function () {
            return false;
        }
    }
    if (!clone) {
        clone = function () {
            return false
        }
    }
    if (!x_space) {
        x_space = 20;
    }
    if (!y_space) {
        y_space = 80;
    }
    if (!type) {
        type = "tree-vertical";
    }

    if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.msMatchesSelector ||
            Element.prototype.webkitMatchesSelector;
    }

    if (!Element.prototype.closest) {
        Element.prototype.closest = function (s) {
            var el = this;
            do {
                if (Element.prototype.matches.call(el, s)) return el;
                el = el.parentElement || el.parentNode;
            } while (el !== null && el.nodeType === 1);
            return null;
        };
    }

    var loaded = false

    jsflow.load = function () {
        if (!loaded) {
            loaded = true
        }
        var blocks = []
        var tempBlocks = [];
        //parte del drop
        var div_canvas = canvas
        //posicion del canvas
        var absx = 0
        var absy = 0
        absx = div_canvas.getBoundingClientRect().left;
        absy = div_canvas.getBoundingClientRect().top;
        var active = false;
        //padding
        var pdX = x_space;
        var pdY = y_space;

        var offsetleft = 0;
        var rearranging = false;
        var drag, dragx, dragy, original;
        var mouse_x, mouse_y;

        var dragblock = false;
        var prevblock = 0;

        var el = document.createElement("DIV");
        el.classList.add('indicator');
        el.classList.add('invisible');
        div_canvas.appendChild(el);

        jsflow.delete = function () {
            blocks = [];
            div_canvas.innerHTML = "<div class='indicator invisible'></div>";
        }

        jsflow.initDrag = function (event) {
            console.log("entro al drag")
            if (window.getComputedStyle(div_canvas).position == "absolute" || window.getComputedStyle(div_canvas).position == "fixed") {
                absx = div_canvas.getBoundingClientRect().left;
                absy = div_canvas.getBoundingClientRect().top;
            }
            if (event.targetTouches) {
                mouse_x = event.changedTouches[0].clientX;
                mouse_y = event.changedTouches[0].clientY;
            } else {
                mouse_x = event.clientX;
                mouse_y = event.clientY;
            }
            if (event.target.closest(".create-flow")) {
                original = event.target.closest(".create-flow");
                var newNode = event.target.closest(".create-flow").cloneNode(true);
                event.target.closest(".create-flow").classList.add("dragnow");
                newNode.classList.add("block");
                newNode.classList.remove("create-flow");
                if (blocks.length === 0) {
                    newNode.innerHTML += "<input type='hidden' name='blockid' class='blockid' value='" + blocks.length + "'>";
                    document.body.appendChild(newNode);
                    drag = document.querySelector(".blockid[value='" + blocks.length + "']").parentNode;
                } else {
                    newNode.innerHTML += "<input type='hidden' name='blockid' class='blockid' value='" + (Math.max.apply(Math, blocks.map(a => a.id)) + 1) + "'>";
                    document.body.appendChild(newNode);
                    drag = document.querySelector(".blockid[value='" + (parseInt(Math.max.apply(Math, blocks.map(a => a.id))) + 1) + "']").parentNode;
                }
                console.log(event.target.closest(".create-flow"))
                blockGrabbed(event.target.closest(".create-flow"));
                drag.classList.add("dragging");
                active = true;
                dragx = mouse_x - (event.target.closest(".create-flow").getBoundingClientRect().left);
                dragy = mouse_y - (event.target.closest(".create-flow").getBoundingClientRect().top);
                drag.style.left = mouse_x - dragx + "px";
                drag.style.top = mouse_y - dragy + "px"; 
            }
        }
        jsflow.endDrag = function (event) {
            if (event.which != 3 && (active || rearranging)) {
                dragblock = false
                blockReleased()
                if (!document.querySelector(".indicator").classList.contains("invisible")) {
                    document.querySelector(".indicator").classList.add("invisible");
                }
                if (active) {
                    original.classList.remove("dragnow")
                    drag.classList.remove("dragging")
                }
                if (parseInt(drag.querySelector(".blockid").value) === 0 && rearranging) {
                    firstBlock("couple")
                } else if (active && blocks.length == 0 && (drag.getBoundingClientRect().top + window.scrollY) > (div_canvas.getBoundingClientRect().top + window.scrollY) && (drag.getBoundingClientRect().left + window.scrollX) > (div_canvas.getBoundingClientRect().left + window.scrollX)) {
                    firstBlock("first");
                } else if (active && blocks.length == 0) {
                    removeSelection();
                } else if (active) {
                    var blocko = blocks.map(a => a.id)
                    for (var i = 0; i < blocks.length; i++) {
                        if (attach(blocko[i])) {
                            active = false
                            if (blockCouple(drag, false, document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode)) {
                                coupling(drag, i, blocko)
                            } else {
                                active = false
                                removeSelection()
                            }
                            break
                        } else if (i == blocks.length - 1) {
                            active = false
                            removeSelection()
                        }
                    }
                } else if (rearranging) {
                    var blocko = blocks.map(a => a.id);
                    for (var i = 0; i < blocks.length; i++) {
                        if (attach(blocko[i])) {
                            active = false;
                            drag.classList.remove("dragging");
                            coupling(drag, i, blocko);
                            break;
                        } else if (i == blocks.length - 1) {
                            if (beforeDelete(drag, blocks.filter(id => id.id == blocko[i])[0])) {
                                active = false;
                                drag.classList.remove("dragging");
                                coupling(drag, blocko.indexOf(prevblock), blocko);
                                break;
                            } else {
                                rearrange = false;
                                tempBlocks = [];
                                active = false;
                                removeSelection();
                                break;
                            }
                        }
                    }
                }
            }
        }
        function attach(id) {
            var xpos
            var ypos
            switch (type) {
                case "tree-vertical": {
                    xpos = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + div_canvas.scrollLeft - div_canvas.getBoundingClientRect().left;
                    ypos = (drag.getBoundingClientRect().top + window.scrollY) + div_canvas.scrollTop - div_canvas.getBoundingClientRect().top;
                    if (xpos >= blocks.filter(a => a.id == id)[0].x - (blocks.filter(a => a.id == id)[0].width / 2) - pdX && xpos <= blocks.filter(a => a.id == id)[0].x + (blocks.filter(a => a.id == id)[0].width / 2) + pdX && ypos >= blocks.filter(a => a.id == id)[0].y - (blocks.filter(a => a.id == id)[0].height / 2) && ypos <= blocks.filter(a => a.id == id)[0].y + blocks.filter(a => a.id == id)[0].height) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        }
        function removeSelection() {
            div_canvas.appendChild(document.querySelector(".indicator"))
            drag.parentNode.removeChild(drag)
        }

        function firstBlock(type) {
            switch (type) {
                case "first": {
                    blockCouple(drag, true, undefined)
                    active = false
                    drag.style.top = (drag.getBoundingClientRect().top + window.scrollY) - (absy + window.scrollY) + div_canvas.scrollTop + "px";
                    drag.style.left = (drag.getBoundingClientRect().left + window.scrollX) - (absx + window.scrollX) + div_canvas.scrollLeft + "px";
                    canvas_div.appendChild(drag);
                    blocks.push({
                        parent: -1,
                        childWidth: 0,
                        id: drag.querySelector(".blockid").value,
                        x: (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + div_canvas.scrollLeft - div_canvas.getBoundingClientRect().left,
                        y: (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height) / 2) + div_canvas.scrollTop - div_canvas.getBoundingClientRect().top,
                        width: parseInt(window.getComputedStyle(drag).width),
                        height: parseInt(window.getComputedStyle(drag).height)
                    })
                }
                case "couple":{
                    drag.classList.remove("dragging")
                    rearranging=false
                }
            }
        }
        function coupling(drag, i, blocko){
            if(!rearranging){
                div_canvas.appendChild(drag)
            }
            var totalwidth=0
            var totalremove=0
            var maxheight=0
        }

        document.addEventListener("mousedown", jsflow.initDrag);
        //document.addEventListener("mousedown", touchblock, false);
        document.addEventListener("touchstart", jsflow.initDrag);
       // document.addEventListener("touchstart", touchblock, false);
        

        //document.addEventListener("mouseup", touchblock, false);
        //document.addEventListener("mousemove", flowy.moveBlock, false);
        //document.addEventListener("touchmove", flowy.moveBlock, false);

        document.addEventListener("mouseup", jsflow.endDrag, false);
        document.addEventListener("touchend", jsflow.endDrag, false);

    }

    function blockGrabbed(block) {
        grab(block);
    }

    function blockReleased() {
        release();
    }

    function blockCouple(drag, first, parent) {
        return couple(drag, first, parent);
    }

    function beforeDelete(drag, parent) {
        return rearranging(drag, parent);
    }

    function blockClone(block,parent){
        scale(block,parent);
    }

    function addEventListenerMulti(type, listener, capture, selector) {
        var nodes = document.querySelectorAll(selector);
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].addEventListener(type, listener, capture);
        }
    }

    function removeEventListenerMulti(type, listener, capture, selector) {
        var nodes = document.querySelectorAll(selector);
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].removeEventListener(type, listener, capture);
        }
    }

    jsflow.load();
}