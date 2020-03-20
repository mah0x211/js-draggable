//
// Copyright (C) Masatoshi Fukunaga - All Rights Reserved.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//
(function(global) {
    'use strict';
    const DraggableUserdata = '__draggable_userdata__';

    function invoke(ctx, ev, typ) {
        const target = ctx.target;
        const parent = target.parentElement;
        const offx = parent.scrollLeft - ctx.scrollLeft;
        const offy = parent.scrollTop - ctx.scrollTop;
        let dx = ev.screenX - ctx.screenX + offx;
        let dy = ev.screenY - ctx.screenY + offy;
        let x = ctx.x + dx;
        let y = ctx.y + dy;

        // prevent underflow
        if (x < 0) {
            dx -= x;
            x = 0;
        }
        if (y < 0) {
            dy -= y;
            y = 0;
        }

        // prevent overflow
        if (!ctx.overflow) {
            const bounds = target.getBoundingClientRect();
            const parentBounds = parent.getBoundingClientRect();
            const maxX = parentBounds.width - bounds.width;
            const maxY = parentBounds.height - bounds.height;
            if (x > maxX) {
                dx -= x - maxX;
                x = maxX;
            }
            if (y > maxY) {
                dy -= y - maxY;
                y = maxY;
            }
        }

        // update position
        ctx.callback.call(
            ctx.self,
            ctx.self[DraggableUserdata],
            target,
            x,
            y,
            dx,
            dy,
            typ,
            ev
        );
    }

    const REGION_ID = 'DRAGGABLE_REGION';

    function onDrag(ev) {
        ev.preventDefault();
        // get region element
        let div = this;
        if (div === document) {
            div = document.getElementById(REGION_ID);
        }

        invoke(div.ctx, ev, 'move');
    }

    function onDragEnd(ev) {
        ev.preventDefault();
        // get region element
        let div = this;
        if (div === document) {
            div = document.getElementById(REGION_ID);
        }

        const self = div.ctx.self;
        div.removeEventListener('mousemove', onDrag);
        div.removeEventListener('mouseup', onDragEnd);
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', onDragEnd);
        document.removeEventListener('blur', onDragEnd);

        // remove region
        div.parentElement.removeChild(div);
        invoke(div.ctx, ev, 'end');

        // remove userdata
        delete self[DraggableUserdata];
    }

    function onDragStart(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        // create region rect
        const data = this._draggable;
        const udata = {};
        const target = data.confirmCb(udata, this);
        // save userdata
        this[DraggableUserdata] = udata;

        const parent = target.parentElement;
        const div = document.createElement('div');
        div.id = REGION_ID;
        div.style.position = 'absolute';
        div.style.top = '0';
        div.style.left = '0';
        div.style.width = parent.scrollWidth + 'px';
        div.style.height = parent.scrollHeight + 'px';
        div.addEventListener('mousemove', onDrag);
        div.addEventListener('mouseup', onDragEnd);
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', onDragEnd);
        document.addEventListener('blur', onDragEnd);
        // save clicked position
        div.ctx = {
            self: this,
            target: target,
            callback: data.dragCb,
            overflow: data.overflow,
            x: target.offsetLeft,
            y: target.offsetTop,
            screenX: ev.screenX,
            screenY: ev.screenY,
            scrollLeft: parent.scrollLeft,
            scrollTop: parent.scrollTop
        };
        parent.appendChild(div);

        invoke(div.ctx, ev, 'start');
    }

    function DefalutDragTargetCb() {}
    function DefaultConfirmDragTargetCb(target) {
        return target;
    }

    /**
     * DragTargetCb
     * @callback DragTargetCb
     * @this {Element} element that event trigger
     * @param {Object} userdata object that exists only on dragging
     * @param {Element} target element
     * @param {Number} x position in the parent element
     * @param {Number} y position in the parent element
     * @param {Number} dx delta position in the parent element
     * @param {Number} dy delta position in the parent element
     * @param {String} type "start", "move", or "stop"
     * @param {DragEvent} ev
     */

    /**
     * ConfirmDragTargetCb
     * @callback ConfirmDragTargetCb
     * @param {Object} userdata object that exists only on dragging
     * @param {Element} target element
     * @return {Element} that will be target element
     */

    /**
     * Make the element draggable
     * @param {Element} elm becomes draggable
     * @param {Boolean} overflow elm can move outside the padding box if true
     * @param {DragTargetCb} dragCb called after calculating the position of target elm
     * @param {ConfirmDragTargetCb} confirmCb called to confirm the target elm
     * @throws {TypeError} throws TypeError if invalid callback arguments are passed
     */
    function Draggable(elm, overflow, dragCb, confirmCb) {
        dragCb = dragCb || DefalutDragTargetCb;
        confirmCb = confirmCb || DefaultConfirmDragTargetCb;
        if (typeof dragCb !== 'function') {
            throw new TypeError('dragCb is not function');
        } else if (typeof confirmCb !== 'function') {
            throw new TypeError('dragCb is not function');
        }

        elm._draggable = {
            dragCb: dragCb,
            confirmCb: confirmCb,
            overflow: overflow === true
        };
        elm.addEventListener('mousedown', onDragStart);
    }

    /**
     * Make the element undraggable
     * @param {HTMLElement} elm becomes undraggable
     */
    function Undraggable(elm) {
        delete elm._draggable;
        elm.removeEventListener('mousedown', onDragStart);
    }

    // export
    global.Draggable = Draggable;
    global.Undraggable = Undraggable;
})(this);
