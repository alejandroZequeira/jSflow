var jsflow = function (canvas, grab, release, couple, rearrange, x_space, y_space, type) {
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
    if (!rearrange) {
        rearrange = function () {
            return false;
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
        if (window.getComputedStyle(div_canvas).position == "absolute" || window.getComputedStyle(div_canvas).position == "fixed") {
            absx = div_canvas.getBoundingClientRect().left;
            absy = div_canvas.getBoundingClientRect().top;
        }
        var active = false;
        //padding
        var pdX = x_space;
        var pdY = y_space;

        var offsetleft = 0;
        var rearrange = false;
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
        //cuando se agarra el bloque
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
            if (event.which != 3 && event.target.closest(".create-flow")) {
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
                blockGrabbed(event.target.closest(".create-flow"));
                drag.classList.add("dragging");
                active = true;
                dragx = mouse_x - (event.target.closest(".create-flow").getBoundingClientRect().left);
                dragy = mouse_y - (event.target.closest(".create-flow").getBoundingClientRect().top);
                drag.style.left = mouse_x - dragx + "px";
                drag.style.top = mouse_y - dragy + "px";
            }
        }
        //cuando se suelta el bloque
        jsflow.endDrag = function (event) {
            if (event.which != 3 && (active || rearrange)) {
                dragblock = false;
                blockReleased();
                if (!document.querySelector(".indicator").classList.contains("invisible")) {
                    document.querySelector(".indicator").classList.add("invisible");
                }
                if (active) {
                    original.classList.remove("dragnow");
                    drag.classList.remove("dragging");
                }
                if (parseInt(drag.querySelector(".blockid").value) === 0 && rearrange) {
                    firstBlock("rearrange")
                } else if (active && blocks.length == 0 && (drag.getBoundingClientRect().top + window.scrollY) > (div_canvas.getBoundingClientRect().top + window.scrollY) && (drag.getBoundingClientRect().left + window.scrollX) > (div_canvas.getBoundingClientRect().left + window.scrollX)) {
                    firstBlock("drop");
                } else if (active && blocks.length == 0) {
                    removeSelection();
                } else if (active) {
                    var blocko = blocks.map(a => a.id);
                    for (var i = 0; i < blocks.length; i++) {
                        if (attach(blocko[i])) {
                            active = false;
                            if (blockCouple(drag, false, document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode)) {
                                coupling(drag, i, blocko);
                            } else {
                                active = false;
                                removeSelection();
                            }
                            break;
                        } else if (i == blocks.length - 1) {
                            active = false;
                            removeSelection();
                        }
                    }
                } else if (rearrange) {
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
        //checa donde escaja el bloque
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
        //verifica si es el primer bloque
        function firstBlock(tp) {
            if (tp == "drop") {
                blockCouple(drag, true, undefined);
                active = false;
                drag.style.top = (drag.getBoundingClientRect().top + window.scrollY) - (absy + window.scrollY) + div_canvas.scrollTop + "px";
                drag.style.left = (drag.getBoundingClientRect().left + window.scrollX) - (absx + window.scrollX) + div_canvas.scrollLeft + "px";
                div_canvas.appendChild(drag);
                blocks.push({
                    parent: -1,
                    childwidth: 0,
                    id: parseInt(drag.querySelector(".blockid").value),
                    x: (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + div_canvas.scrollLeft - div_canvas.getBoundingClientRect().left,
                    y: (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height) / 2) + div_canvas.scrollTop - div_canvas.getBoundingClientRect().top,
                    width: parseInt(window.getComputedStyle(drag).width),
                    height: parseInt(window.getComputedStyle(drag).height)
                });
            } else if (tp == "rearrange") {
                drag.classList.remove("dragging");
                rearrange = false;
                for (var w = 0; w < tempBlocks.length; w++) {
                    if (tempBlocks[w].id != parseInt(drag.querySelector(".blockid").value)) {
                        const blockParent = document.querySelector(".blockid[value='" + tempBlocks[w].id + "']").parentNode;
                        const arrowParent = document.querySelector(".arrowid[value='" + tempBlocks[w].id + "']").parentNode;
                        blockParent.style.left = (blockParent.getBoundingClientRect().left + window.scrollX) - (window.scrollX) + div_canvas.scrollLeft - 1 - absx + "px";
                        blockParent.style.top = (blockParent.getBoundingClientRect().top + window.scrollY) - (window.scrollY) + div_canvas.scrollTop - absy - 1 + "px";
                        arrowParent.style.left = (arrowParent.getBoundingClientRect().left + window.scrollX) - (window.scrollX) + div_canvas.scrollLeft - absx - 1 + "px";
                        arrowParent.style.top = (arrowParent.getBoundingClientRect().top + window.scrollY) + div_canvas.scrollTop - 1 - absy + "px";
                        div_canvas.appendChild(blockParent);
                        div_canvas.appendChild(arrowParent);
                        tempBlocks[w].x = (blockParent.getBoundingClientRect().left + window.scrollX) + (parseInt(blockParent.offsetWidth) / 2) + div_canvas.scrollLeft - div_canvas.getBoundingClientRect().left - 1;
                        tempBlocks[w].y = (blockParent.getBoundingClientRect().top + window.scrollY) + (parseInt(blockParent.offsetHeight) / 2) + div_canvas.scrollTop - div_canvas.getBoundingClientRect().top - 1;
                    }
                }
                tempBlocks.filter(a => a.id == 0)[0].x = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + div_canvas.scrollLeft - div_canvas.getBoundingClientRect().left;
                tempBlocks.filter(a => a.id == 0)[0].y = (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height) / 2) + div_canvas.scrollTop - div_canvas.getBoundingClientRect().top;
                blocks = blocks.concat(tempBlocks);
                tempBlocks = [];
            }
        }
        //dibuja la flecha
        function arrow(blockArrow, x, y, id) {
            if (x < 0) {
                div_canvas.innerHTML += '<div class="arrowblock"><input type="hidden" class="arrowid" value="' + drag.querySelector(".blockid").value + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M' + (blocks.filter(a => a.id == id)[0].x - blockArrow.x + 5) + ' 0L' + (blocks.filter(a => a.id == id)[0].x - blockArrow.x + 5) + ' ' + (pdY / 2) + 'L5 ' + (pdY / 2) + 'L5 ' + y + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M0 ' + (y - 5) + 'H10L5 ' + y + 'L0 ' + (y - 5) + 'Z" fill="#C5CCD0"/></svg></div>';
                document.querySelector('.arrowid[value="' + drag.querySelector(".blockid").value + '"]').parentNode.style.left = (blockArrow.x - 5) - (absx + window.scrollX) + div_canvas.scrollLeft + div_canvas.getBoundingClientRect().left + "px";
            } else {
                div_canvas.innerHTML += '<div class="arrowblock"><input type="hidden" class="arrowid" value="' + drag.querySelector(".blockid").value + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L20 ' + (pdY / 2) + 'L' + (x) + ' ' + (pdY / 2) + 'L' + x + ' ' + y + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M' + (x - 5) + ' ' + (y - 5) + 'H' + (x + 5) + 'L' + x + ' ' + y + 'L' + (x - 5) + ' ' + (y - 5) + 'Z" fill="#C5CCD0"/></svg></div>';
                document.querySelector('.arrowid[value="' + parseInt(drag.querySelector(".blockid").value) + '"]').parentNode.style.left = blocks.filter(a => a.id == id)[0].x - 20 - (absx + window.scrollX) + div_canvas.scrollLeft + div_canvas.getBoundingClientRect().left + "px";
            }
            document.querySelector('.arrowid[value="' + parseInt(drag.querySelector(".blockid").value) + '"]').parentNode.style.top = blocks.filter(a => a.id == id)[0].y + (blocks.filter(a => a.id == id)[0].height / 2) + div_canvas.getBoundingClientRect().top - absy + "px";

        }
        //actualiza la flecha
        function arrowUpdate(arrow, x, y, children) {
            if (x < 0) {
                document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.style.left = (arrow.x - 5) - (absx + window.scrollX) + div_canvas.getBoundingClientRect().left + "px";
                document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.innerHTML = '<input type="hidden" class="arrowid" value="' + children.id + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M' + (blocks.filter(id => id.id == children.parent)[0].x - arrow.x + 5) + ' 0L' + (blocks.filter(id => id.id == children.parent)[0].x - arrow.x + 5) + ' ' + (pdY / 2) + 'L5 ' + (pdY / 2) + 'L5 ' + y + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M0 ' + (y - 5) + 'H10L5 ' + y + 'L0 ' + (y - 5) + 'Z" fill="#C5CCD0"/></svg>';
            } else {
                document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.style.left = blocks.filter(id => id.id == children.parent)[0].x - 20 - (absx + window.scrollX) + div_canvas.getBoundingClientRect().left + "px";
                document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.innerHTML = '<input type="hidden" class="arrowid" value="' + children.id + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L20 ' + (pdY / 2) + 'L' + (x) + ' ' + (pdY / 2) + 'L' + x + ' ' + y + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M' + (x - 5) + ' ' + (y - 5) + 'H' + (x + 5) + 'L' + x + ' ' + y + 'L' + (x - 5) + ' ' + (y - 5) + 'Z" fill="#C5CCD0"/></svg>';
            }
        }
        //encaja la flecha
        function coupling(drag, i, blocko) {
            console.log("valor de i:",i)
            console.log("valor de blocko:",blocko)
            console.log("valor de blocko[i]:",blocko[i])
            if (!rearrange) {
                div_canvas.appendChild(drag);
            }
            var totalwidth = 0;
            var totalremove = 0;
            var maxheight = 0;
            switch (type) {
                case "tree-vertical": {
                    for (var w = 0; w < blocks.filter(id => id.parent == blocko[i]).length; w++) {
                        var children = blocks.filter(id => id.parent == blocko[i])[w];
                        if (children.childwidth > children.width) {
                            totalwidth += children.childwidth + pdX;
                        } else {
                            totalwidth += children.width + pdX;
                        }
                    }
                    totalwidth += parseInt(window.getComputedStyle(drag).width);
                    for (var w = 0; w < blocks.filter(id => id.parent == blocko[i]).length; w++) {
                        var children = blocks.filter(id => id.parent == blocko[i])[w];
                        if (children.childwidth > children.width) {
                            document.querySelector(".blockid[value='" + children.id + "']").parentNode.style.left = blocks.filter(a => a.id == blocko[i])[0].x - (totalwidth / 2) + totalremove + (children.childwidth / 2) - (children.width / 2) + "px";
                            children.x = blocks.filter(id => id.parent == blocko[i])[0].x - (totalwidth / 2) + totalremove + (children.childwidth / 2);
                            totalremove += children.childwidth + pdX;
                        } else {
                            document.querySelector(".blockid[value='" + children.id + "']").parentNode.style.left = blocks.filter(a => a.id == blocko[i])[0].x - (totalwidth / 2) + totalremove + "px";
                            children.x = blocks.filter(id => id.parent == blocko[i])[0].x - (totalwidth / 2) + totalremove + (children.width / 2);
                            totalremove += children.width + pdX;
                        }
                    }
                    drag.style.left = blocks.filter(id => id.id == blocko[i])[0].x - (totalwidth / 2) + totalremove - (window.scrollX + absx) + div_canvas.scrollLeft + div_canvas.getBoundingClientRect().left + "px";
                    drag.style.top = blocks.filter(id => id.id == blocko[i])[0].y + (blocks.filter(id => id.id == blocko[i])[0].height / 2) + pdY - (window.scrollY + absy) + div_canvas.getBoundingClientRect().top + "px";
                    if (rearrange) {
                        tempBlocks.filter(a => a.id == parseInt(drag.querySelector(".blockid").value))[0].x = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + div_canvas.scrollLeft - div_canvas.getBoundingClientRect().left;
                        tempBlocks.filter(a => a.id == parseInt(drag.querySelector(".blockid").value))[0].y = (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height) / 2) + div_canvas.scrollTop - div_canvas.getBoundingClientRect().top;
                        tempBlocks.filter(a => a.id == drag.querySelector(".blockid").value)[0].parent = blocko[i];
                        for (var w = 0; w < tempBlocks.length; w++) {
                            if (tempBlocks[w].id != parseInt(drag.querySelector(".blockid").value)) {
                                const blockParent = document.querySelector(".blockid[value='" + tempBlocks[w].id + "']").parentNode;
                                const arrowParent = document.querySelector(".arrowid[value='" + tempBlocks[w].id + "']").parentNode;
                                blockParent.style.left = (blockParent.getBoundingClientRect().left + window.scrollX) - (window.scrollX + div_canvas.getBoundingClientRect().left) + div_canvas.scrollLeft + "px";
                                blockParent.style.top = (blockParent.getBoundingClientRect().top + window.scrollY) - (window.scrollY + div_canvas.getBoundingClientRect().top) + div_canvas.scrollTop + "px";
                                arrowParent.style.left = (arrowParent.getBoundingClientRect().left + window.scrollX) - (window.scrollX + div_canvas.getBoundingClientRect().left) + div_canvas.scrollLeft + 20 + "px";
                                arrowParent.style.top = (arrowParent.getBoundingClientRect().top + window.scrollY) - (window.scrollY + div_canvas.getBoundingClientRect().top) + div_canvas.scrollTop + "px";
                                div_canvas.appendChild(blockParent);
                                div_canvas.appendChild(arrowParent);

                                tempBlocks[w].x = (blockParent.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(blockParent).width) / 2) + div_canvas.scrollLeft - div_canvas.getBoundingClientRect().left;
                                tempBlocks[w].y = (blockParent.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(blockParent).height) / 2) + div_canvas.scrollTop - div_canvas.getBoundingClientRect().top;
                            }
                        }
                        blocks = blocks.concat(tempBlocks);
                        tempBlocks = [];
                    } else {
                        blocks.push({
                            childwidth: 0,
                            parent: blocko[i],
                            id: parseInt(drag.querySelector(".blockid").value),
                            x: (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + div_canvas.scrollLeft - div_canvas.getBoundingClientRect().left,
                            y: (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height) / 2) + div_canvas.scrollTop - div_canvas.getBoundingClientRect().top,
                            width: parseInt(window.getComputedStyle(drag).width),
                            height: parseInt(window.getComputedStyle(drag).height)
                        });
                    }

                    var arrowblock = blocks.filter(a => a.id == parseInt(drag.querySelector(".blockid").value))[0];
                    var arrowx = arrowblock.x - blocks.filter(a => a.id == blocko[i])[0].x + 20;
                    var arrowy = pdY;
                    arrow(arrowblock, arrowx, arrowy, blocko[i]);

                    if (blocks.filter(a => a.id == blocko[i])[0].parent != -1) {
                        var flag = false;
                        var idval = blocko[i];
                        while (!flag) {
                            if (blocks.filter(a => a.id == idval)[0].parent == -1) {
                                flag = true;
                            } else {
                                var zwidth = 0;
                                for (var w = 0; w < blocks.filter(id => id.parent == idval).length; w++) {
                                    var children = blocks.filter(id => id.parent == idval)[w];
                                    if (children.childwidth > children.width) {
                                        if (w == blocks.filter(id => id.parent == idval).length - 1) {
                                            zwidth += children.childwidth;
                                        } else {
                                            zwidth += children.childwidth + pdX;
                                        }
                                    } else {
                                        if (w == blocks.filter(id => id.parent == idval).length - 1) {
                                            zwidth += children.width;
                                        } else {
                                            zwidth += children.width + pdX;
                                        }
                                    }
                                }
                                blocks.filter(a => a.id == idval)[0].childwidth = zwidth;
                                idval = blocks.filter(a => a.id == idval)[0].parent;
                            }
                        }
                        blocks.filter(id => id.id == idval)[0].childwidth = totalwidth;
                    }
                    if (rearrange) {
                        rearrange = false;
                        drag.classList.remove("dragging");
                    }
                    rearrangeMe();
                    checkOffset();

                } break;

                default:
                    break;
            }

        }
        //verifica si tocaste un bloque
        function touchblock(event) {
            dragblock = false;
            if (hasParentClass(event.target, "block")) {
                var theblock = event.target.closest(".block");
                if (event.targetTouches) {
                    mouse_x = event.targetTouches[0].clientX;
                    mouse_y = event.targetTouches[0].clientY;
                } else {
                    mouse_x = event.clientX;
                    mouse_y = event.clientY;
                }
                if (event.type !== "mouseup" && hasParentClass(event.target, "block")) {
                    if (event.which != 3) {
                        if (!active && !rearrange) {
                            dragblock = true;
                            drag = theblock;
                            dragx = mouse_x - (drag.getBoundingClientRect().left + window.scrollX);
                            dragy = mouse_y - (drag.getBoundingClientRect().top + window.scrollY);
                        }
                    }
                }
            }
        }

        function hasParentClass(elemt, classname) {
            if (elemt.className) {
                if (elemt.className.split(' ').indexOf(classname) >= 0) return true
            }
            return elemt.parentNode && hasParentClass(elemt.parentNode, classname)
        }
        //verifica si moviste un bloque
        jsflow.moveBlock = function (event) {

            if (event.targetTouches) {
                mouse_x = event.targetTouches[0].clientX;
                mouse_y = event.targetTouches[0].clientY;
            } else {
                mouse_x = event.clientX;
                mouse_y = event.clientY;
            }
            if (dragblock) {
                rearrange = true;
                drag.classList.add("dragging");
                var blockid = parseInt(drag.querySelector(".blockid").value);
                prevblock = blocks.filter(a => a.id == blockid)[0].parent;
                tempBlocks.push(blocks.filter(a => a.id == blockid)[0]);
                blocks = blocks.filter(function (e) {
                    return e.id != blockid
                });
                if (blockid != 0) {
                    document.querySelector(".arrowid[value='" + blockid + "']").parentNode.remove();
                }
                var layer = blocks.filter(a => a.parent == blockid);
                var flag = false;
                var foundids = [];
                var allids = [];
                while (!flag) {
                    for (var i = 0; i < layer.length; i++) {
                        if (layer[i] != blockid) {
                            tempBlocks.push(blocks.filter(a => a.id == layer[i].id)[0]);
                            const blockParent = document.querySelector(".blockid[value='" + layer[i].id + "']").parentNode;
                            const arrowParent = document.querySelector(".arrowid[value='" + layer[i].id + "']").parentNode;
                            blockParent.style.left = (blockParent.getBoundingClientRect().left + window.scrollX) - (drag.getBoundingClientRect().left + window.scrollX) + "px";
                            blockParent.style.top = (blockParent.getBoundingClientRect().top + window.scrollY) - (drag.getBoundingClientRect().top + window.scrollY) + "px";
                            arrowParent.style.left = (arrowParent.getBoundingClientRect().left + window.scrollX) - (drag.getBoundingClientRect().left + window.scrollX) + "px";
                            arrowParent.style.top = (arrowParent.getBoundingClientRect().top + window.scrollY) - (drag.getBoundingClientRect().top + window.scrollY) + "px";
                            drag.appendChild(blockParent);
                            drag.appendChild(arrowParent);
                            foundids.push(layer[i].id);
                            allids.push(layer[i].id);
                        }
                    }
                    if (foundids.length == 0) {
                        flag = true;
                    } else {
                        layer = blocks.filter(a => foundids.includes(a.parent));
                        foundids = [];
                    }
                }
                for (var i = 0; i < blocks.filter(a => a.parent == blockid).length; i++) {
                    var blocknumber = blocks.filter(a => a.parent == blockid)[i];
                    blocks = blocks.filter(function (e) {
                        return e.id != blocknumber
                    });
                }
                for (var i = 0; i < allids.length; i++) {
                    var blocknumber = allids[i];
                    blocks = blocks.filter(function (e) {
                        return e.id != blocknumber
                    });
                }
                if (blocks.length > 1) {
                    rearrangeMe();
                }
                dragblock = false;
            }
            if (active) {
                console.log("entro al active")
                drag.style.left = mouse_x - dragx + "px";
                drag.style.top = mouse_y - dragy + "px";
            } else if (rearrange) {
                drag.style.left = mouse_x - dragx - (window.scrollX + absx) + div_canvas.scrollLeft + "px";
                drag.style.top = mouse_y - dragy - (window.scrollY + absy) + div_canvas.scrollTop + "px";
                tempBlocks.filter(a => a.id == parseInt(drag.querySelector(".blockid").value)).x = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + div_canvas.scrollLeft;
                tempBlocks.filter(a => a.id == parseInt(drag.querySelector(".blockid").value)).y = (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height) / 2) + div_canvas.scrollTop;
            }
            if (active || rearrange) {
                if (mouse_x > div_canvas.getBoundingClientRect().width + div_canvas.getBoundingClientRect().left - 10 && mouse_x < div_canvas.getBoundingClientRect().width + div_canvas.getBoundingClientRect().left + 10) {
                    div_canvas.scrollLeft += 10;
                } else if (mouse_x < div_canvas.getBoundingClientRect().left + 10 && mouse_x > div_canvas.getBoundingClientRect().left - 10) {
                    div_canvas.scrollLeft -= 10;
                } else if (mouse_y > div_canvas.getBoundingClientRect().height + div_canvas.getBoundingClientRect().top - 10 && mouse_y < div_canvas.getBoundingClientRect().height + div_canvas.getBoundingClientRect().top + 10) {
                    div_canvas.scrollTop += 10;
                } else if (mouse_y < div_canvas.getBoundingClientRect().top + 10 && mouse_y > div_canvas.getBoundingClientRect().top - 10) {
                    div_canvas.scrollLeft -= 10;
                }
                var xpos = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + div_canvas.scrollLeft - div_canvas.getBoundingClientRect().left;
                var ypos = (drag.getBoundingClientRect().top + window.scrollY) + div_canvas.scrollTop - div_canvas.getBoundingClientRect().top;
                var blocko = blocks.map(a => a.id);
                for (var i = 0; i < blocks.length; i++) {
                    if (attach(blocko[i])) {
                        document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode.appendChild(document.querySelector(".indicator"));
                        document.querySelector(".indicator").style.left = (document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode.offsetWidth / 2) - 5 + "px";
                        document.querySelector(".indicator").style.top = document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode.offsetHeight + "px";
                        document.querySelector(".indicator").classList.remove("invisible");
                        break;
                    } else if (i == blocks.length - 1) {
                        if (!document.querySelector(".indicator").classList.contains("invisible")) {
                            document.querySelector(".indicator").classList.add("invisible");
                        }
                    }
                }
            }

        }
        //verifica el sisguiente
        function checkOffset() {
            offsetleft = blocks.map(a => a.x);
            var widths = blocks.map(a => a.width);
            var mathmin = offsetleft.map(function (item, index) {
                return item - (widths[index] / 2);
            })
            offsetleft = Math.min.apply(Math, mathmin);
            if (offsetleft < (div_canvas.getBoundingClientRect().left + window.scrollX - absx)) {
                var blocko = blocks.map(a => a.id);
                for (var w = 0; w < blocks.length; w++) {
                    document.querySelector(".blockid[value='" + blocks.filter(a => a.id == blocko[w])[0].id + "']").parentNode.style.left = blocks.filter(a => a.id == blocko[w])[0].x - (blocks.filter(a => a.id == blocko[w])[0].width / 2) - offsetleft + div_canvas.getBoundingClientRect().left - absx + 20 + "px";
                    if (blocks.filter(a => a.id == blocko[w])[0].parent != -1) {
                        var arrowblock = blocks.filter(a => a.id == blocko[w])[0];
                        var arrowx = arrowblock.x - blocks.filter(a => a.id == blocks.filter(a => a.id == blocko[w])[0].parent)[0].x;
                        if (arrowx < 0) {
                            document.querySelector('.arrowid[value="' + blocko[w] + '"]').parentNode.style.left = (arrowblock.x - offsetleft + 20 - 5) + div_canvas.getBoundingClientRect().left - absx + "px";
                        } else {
                            document.querySelector('.arrowid[value="' + blocko[w] + '"]').parentNode.style.left = blocks.filter(id => id.id == blocks.filter(a => a.id == blocko[w])[0].parent)[0].x - 20 - offsetleft + div_canvas.getBoundingClientRect().left - absx + 20 + "px";
                        }
                    }
                }
                for (var w = 0; w < blocks.length; w++) {
                    blocks[w].x = (document.querySelector(".blockid[value='" + blocks[w].id + "']").parentNode.getBoundingClientRect().left + window.scrollX) + (div_canvas.scrollLeft) + (parseInt(window.getComputedStyle(document.querySelector(".blockid[value='" + blocks[w].id + "']").parentNode).width) / 2) - 20 - div_canvas.getBoundingClientRect().left;
                }
            }
        }
        //cuando mantienes agarrado un bloque
        function rearrangeMe() {
            var result = blocks.map(a => a.parent);
            for (var z = 0; z < result.length; z++) {
                if (result[z] == -1) {
                    z++;
                }
                var totalwidth = 0;
                var totalremove = 0;
                var maxheight = 0;
                for (var w = 0; w < blocks.filter(id => id.parent == result[z]).length; w++) {
                    var children = blocks.filter(id => id.parent == result[z])[w];
                    if (blocks.filter(id => id.parent == children.id).length == 0) {
                        children.childwidth = 0;
                    }
                    if (children.childwidth > children.width) {
                        if (w == blocks.filter(id => id.parent == result[z]).length - 1) {
                            totalwidth += children.childwidth;
                        } else {
                            totalwidth += children.childwidth + pdX;
                        }
                    } else {
                        if (w == blocks.filter(id => id.parent == result[z]).length - 1) {
                            totalwidth += children.width;
                        } else {
                            totalwidth += children.width + pdX;
                        }
                    }
                }
                if (result[z] != -1) {
                    blocks.filter(a => a.id == result[z])[0].childwidth = totalwidth;
                }
                for (var w = 0; w < blocks.filter(id => id.parent == result[z]).length; w++) {
                    var children = blocks.filter(id => id.parent == result[z])[w];
                    const r_block = document.querySelector(".blockid[value='" + children.id + "']").parentNode;
                    const r_array = blocks.filter(id => id.id == result[z]);
                    r_block.style.top = r_array.y + pdY + div_canvas.getBoundingClientRect().top - absy + "px";
                    r_array.y = r_array.y + pdY;
                    if (children.childwidth > children.width) {
                        r_block.style.left = r_array[0].x - (totalwidth / 2) + totalremove + (children.childwidth / 2) - (children.width / 2) - (absx + window.scrollX) + div_canvas.getBoundingClientRect().left + "px";
                        children.x = r_array[0].x - (totalwidth / 2) + totalremove + (children.childwidth / 2);
                        totalremove += children.childwidth + pdX;
                    } else {
                        r_block.style.left = r_array[0].x - (totalwidth / 2) + totalremove - (absx + window.scrollX) + div_canvas.getBoundingClientRect().left + "px";
                        children.x = r_array[0].x - (totalwidth / 2) + totalremove + (children.width / 2);
                        totalremove += children.width + pdX;
                    }

                    var arrowblock = blocks.filter(a => a.id == children.id)[0];
                    var arrowx = arrowblock.x - blocks.filter(a => a.id == children.parent)[0].x + 20;
                    var arrowy = pdY;
                    arrowUpdate(arrowblock, arrowx, arrowy, children);
                }
            }
        }

        jsflow.blockclone = function (block) {
            var newNode = block.cloneNode(true);
            var remove = newNode.querySelector(".blockid")
            if (remove.value == 0) {
                console.log("bloques a remover", remove)
                newNode.removeChild(remove)
            } else {
                var arrowremove = newNode.querySelector(".arrowid")
                console.log("bloques a remover", remove, arrowremove)
                newNode.removeChild(remove)
                newNode.removeChild(arrowremove)
            }
            newNode.innerHTML += "<input type='hidden' name='blockid' class='blockid' value='" + (Math.max.apply(Math, blocks.map(a => a.id)) + 1) + "'>";
            document.body.appendChild(newNode);
            drag = document.querySelector(".blockid[value='" + (parseInt(Math.max.apply(Math, blocks.map(a => a.id))) + 1) + "']").parentNode;
            var blocko = blocks.map(a => a.id);
            for (var i = 0; i < blocks.length; i++) {
                if (block.querySelector(".blockid").value==0&&block.querySelector(".blockid").value==blocko[i]) {
                    coupling(drag, 0, blocko);
                } else if (block.querySelector(".blockid").value==blocko[i]) {
                    coupling(drag, i, blocko);
                }
            }
            return true
        }


        //control de los eventos touch y click 

        document.addEventListener("mousedown", jsflow.initDrag);
        document.addEventListener("mousedown", touchblock, false);
        document.addEventListener("touchstart", jsflow.initDrag);
        document.addEventListener("touchstart", touchblock, false);


        document.addEventListener("mouseup", touchblock, false);
        document.addEventListener("mousemove", jsflow.moveBlock, false);
        document.addEventListener("touchmove", jsflow.moveBlock, false);

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
        //console.log("entro en blockCouple")
        return couple(drag, first, parent);
    }

    function beforeDelete(drag, parent) {
        return rearrange(drag, parent);
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