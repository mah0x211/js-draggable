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

    const IsTouchDevice =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0;

    function Noop() {}

    function GetBoundingRect(elm) {
        let rect = elm.getBoundingClientRect();
        return {
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right,
            width: rect.right - rect.left,
            height: rect.bottom - rect.top
        };
    }

    function invoke(ctx, ev, typ) {
        const target = ctx.target;
        let left = ctx.srcX + (ev.screenX - ctx.startX);
        let top = ctx.srcY + (ev.screenY - ctx.startY);

        // prevent overflow
        if (!ctx.overflow) {
            const bounds = GetBoundingRect(target);
            const parentBounds = GetBoundingRect(target.parentNode);
            const maxLeft = parentBounds.width - bounds.width;
            const maxTop = parentBounds.height - bounds.height;
            if (left > maxLeft) {
                left = maxLeft;
            }
            if (top > maxTop) {
                top = maxTop;
            }
        }

        // prevent underflow
        if (left < 0) {
            left = 0;
        }
        if (top < 0) {
            top = 0;
        }

        // update position
        ctx.callback.call(target, ev, typ, left, top);
    }

    const REGION_ID = 'DRAGGABLE_REGION';

    function onDrag(ev) {
        if (IsTouchDevice) {
            ev.preventDefault();
            ev = ev.changedTouches[0];
        }

        let div = this;
        if (div === document) {
            div = document.getElementById(REGION_ID);
        }
        invoke(div.ctx, ev, 'move');
    }

    function onDragEnd(ev) {
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', onDragEnd);
        document.removeEventListener('blur', onDragEnd);
        if (IsTouchDevice) {
            ev.preventDefault();
            ev = ev.changedTouches[0];
        }

        // remove region
        let div = this;
        if (div === document) {
            div = document.getElementById(REGION_ID);
        }
        div.parentNode.removeChild(div);
        invoke(div.ctx, ev, 'end');
    }

    function onDragStart(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        if (IsTouchDevice) {
            ev = ev.changedTouches[0];
        }

        // create region rect
        const parent = this.parentNode;
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
        const bounds = this.getBoundingClientRect();
        const data = this._draggable;
        div.ctx = {
            target: this,
            callback: data.callback,
            overflow: data.overflow,
            startX: ev.screenX + parent.offsetLeft - parent.scrollLeft,
            startY: ev.screenY + parent.offsetTop - parent.scrollTop,
            srcX: bounds.left,
            srcY: bounds.top
        };
        parent.appendChild(div);

        invoke(div.ctx, ev, 'start');
    }

    // export
    /**
     * DraggableCb
     * @callback DraggableCb
     * @param {DragEvent} ev
     * @param {String} type "start", "move", or "stop"
     * @param {Number} left position in the parent node
     * @param {Number} top position in the parent node
     */

    /**
     * Make the element draggable
     * @param {HTMLElement} elm becomes draggable
     * @param {Boolean} overflow elm can move outside the padding box if true
     * @param {DraggableCb} callback called after calculating the position of elm
     * @throws {TypeError} throws TypeError if callback is not function
     */
    global.Draggable = function Draggable(elm, overflow, callback) {
        callback = callback || Noop;
        if (typeof callback !== 'function') {
            throw new TypeError('callback is not function');
        }

        elm._draggable = {
            callback: callback,
            overflow: overflow === true
        };
        elm.setAttribute('draggable', true);
        if (IsTouchDevice) {
            elm.addEventListener('touchstart', onDragStart);
        } else {
            elm.addEventListener('dragstart', onDragStart);
        }
    };

    /**
     * Make the element undraggable
     * @param {HTMLElement} elm becomes draggable
     */
    global.Undraggable = function Undraggable(elm) {
        delete elm._draggable;
        elm.removeAttribute('draggable');
        if (IsTouchDevice) {
            elm.removeEventListener('touchstart', onDragStart);
        } else {
            elm.removeEventListener('dragstart', onDragStart);
        }
    };
})(this);
