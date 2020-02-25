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

    function onDrag(ev) {
        const data = this._draggable;
        const parent = this.parentNode;
        const bounds = GetBoundingRect(this);
        let left = ev.pageX - parent.offsetLeft - data.shiftX;
        let top = ev.pageY - parent.offsetTop - data.shiftY;

        if (!data.overflow) {
            const parentBounds = GetBoundingRect(parent);
            const maxLeft = parentBounds.width - bounds.width;
            const maxTop = parentBounds.height - bounds.height;
            if (left > maxLeft) {
                left = maxLeft;
            }
            if (top > maxTop) {
                top = maxTop;
            }
        }

        if (left < 0) {
            left = 0;
        }
        if (top < 0) {
            top = 0;
        }
        // update position
        this.style.left = left + 'px';
        this.style.top = top + 'px';

        if (IsTouchDevice) {
            ev.preventDefault();
        }

        try {
            data.callback.call(this, ev);
        } catch (e) {
            console.error(e);
        }
    }

    function onDragEnd(ev) {
        const data = this._draggable;

        // remove region
        data.region.parentNode.removeChild(data.region);
        data.region = null;
        if (IsTouchDevice) {
            ev.preventDefault();
        } else {
            // remove ghost image
            data.ghost.parentNode.removeChild(data.ghost);
        }

        try {
            data.callback.call(this, ev);
        } catch (e) {
            console.error(e);
        }
    }

    function onDragStart(ev) {
        const data = this._draggable;
        let pageX = ev.pageX;
        let pageY = ev.pageY;

        if (IsTouchDevice) {
            ev.preventDefault();
            pageX = ev.changedTouches[0].pageX;
            pageY = ev.changedTouches[0].pageY;
        } else {
            // hide ghost image by custom image
            this.parentNode.appendChild(data.ghost);
            ev.dataTransfer.setDragImage(data.ghost, 0, 0);
        }

        // save clicked position
        const parent = this.parentNode;
        const bounds = this.getBoundingClientRect();
        data.shiftX = pageX - bounds.left - parent.scrollLeft;
        data.shiftY = pageY - bounds.top - parent.scrollTop;

        // create region rect
        const div = document.createElement('div');
        div.style.width = parent.scrollWidth + 'px';
        div.style.height = parent.scrollHeight + 'px';
        data.region = div;
        parent.appendChild(div);

        try {
            data.callback.call(this, ev);
        } catch (e) {
            console.error(e);
        }
    }

    // export
    /**
     * DraggableCb
     * @callback DraggableCb
     * @param {DragEvent} ev
     */

    /**
     * Make the element draggable
     * @param {HTMLElement} elm becomes draggable
     * @param {Boolean} overflow elm can move outside the padding box if true
     * @param {DraggableCb} callback called after changing the position of elm
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
            elm.addEventListener('touchend', onDragEnd);
            elm.addEventListener('touchmove', onDrag);
        } else {
            elm.addEventListener('dragstart', onDragStart);
            elm.addEventListener('dragend', onDragEnd);
            elm.addEventListener('drag', onDrag);
            // create custom ghost image
            const ghost = document.createElement('img');
            ghost.width = 1;
            ghost.height = 1;
            ghost.style.position = 'absolute';
            ghost.style.visibility = 'hidden';
            elm._draggable.ghost = ghost;
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
            elm.removeEventListener('touchend', onDragEnd);
            elm.removeEventListener('touchmove', onDrag);
        } else {
            elm.removeEventListener('dragstart', onDragStart);
            elm.removeEventListener('dragend', onDragEnd);
            elm.removeEventListener('drag', onDrag);
        }
    };
})(this);
