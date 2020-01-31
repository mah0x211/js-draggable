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
        let left = ev.pageX - parent.offsetLeft - data.shiftX;
        let top = ev.pageY - parent.offsetTop - data.shiftY;
        const bounds = GetBoundingRect(this);
        const parentBounds = GetBoundingRect(parent);
        const maxLeft = parentBounds.width - bounds.width;
        const maxTop = parentBounds.height - bounds.height;

        if (left < 0) {
            left = 0;
        } else if (left > maxLeft) {
            left = maxLeft;
        }
        if (top < 0) {
            top = 0;
        } else if (top > maxTop) {
            top = maxTop;
        }

        this.style.left = left + 'px';
        this.style.top = top + 'px';

        if (IsTouchDevice) {
            ev.preventDefault();
        }
    }

    function onDragEnd(ev) {
        if (IsTouchDevice) {
            ev.preventDefault();
        } else {
            // remove ghost image
            const data = this._draggable;
            data.ghost.parentNode.removeChild(data.ghost);
        }
    }

    function onDragStart(ev) {
        const data = this._draggable;
        const bounds = this.getBoundingClientRect();
        let clientX = ev.clientX;
        let clientY = ev.clientY;

        if (IsTouchDevice) {
            ev.preventDefault();
            clientX = ev.changedTouches[0].clientX;
            clientY = ev.changedTouches[0].clientY;
        } else {
            // hide ghost image by custom image
            this.parentNode.appendChild(data.ghost);
            ev.dataTransfer.setDragImage(data.ghost, 0, 0);
        }

        // save clicked position
        data.shiftX = clientX - bounds.left;
        data.shiftY = clientY - bounds.top;
    }

    // export
    global.Draggable = function(elm) {
        elm._draggable = {};
        if (IsTouchDevice) {
            elm.addEventListener('touchstart', onDragStart);
            elm.addEventListener('touchend', onDragEnd);
            elm.addEventListener('touchmove', onDrag);
        } else {
            elm.setAttribute('draggable', true);
            elm.addEventListener('dragstart', onDragStart);
            elm.addEventListener('dragend', onDragEnd);
            elm.addEventListener('drag', onDrag);
            // create custom ghost image
            const ghost = document.createElement('img');
            ghost.width = 1;
            ghost.height = 1;
            ghost.style.visibility = 'hidden';
            elm._draggable.ghost = ghost;
        }
    };

    global.Undraggable = function(elm) {
        delete elm._draggable;
        if (IsTouchDevice) {
            elm.removeEventListener('touchstart', onDragStart);
            elm.removeEventListener('touchend', onDragEnd);
            elm.removeEventListener('touchmove', onDrag);
        } else {
            elm.removeAttribute('draggable');
            elm.removeEventListener('dragstart', onDragStart);
            elm.removeEventListener('dragend', onDragEnd);
            elm.removeEventListener('drag', onDrag);
        }
    };
})(this);
