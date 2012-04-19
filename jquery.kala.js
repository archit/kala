/*
 *
 * Copyright (c) 2012 Archit Baweja
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 * 
 * Version 0.9.0
 * Demo: http://archit.name/
 */
(function ($) {
  /*
   * Allows only time characters to be input
   * TODO:
   *   Support other separators besides ':'
   *
   * @name     kala
   * @param    config        { jackBauer: true } 
   * @param    callback      A function that runs if the number is not valid (fires onblur)
   * @author   Archit Baweja architbaweja@gmail.com
   * @example  $(".kala").kala();
   */
  $.fn.kala = function(config, callback)
  {
    // shorthand for 24 hour format
    if (typeof config === 'boolean') {
      config = { 'jackBauer' : true };
    }
    config = config || {};
    // callback function
    var callback = typeof callback == "function" ? callback : function(){};
    // set data and methods
    return this.data("kala.jackBauer", false).data("kala.callback", callback).keypress($.fn.kala.keypress).keyup($.fn.kala.keyup).blur($.fn.kala.blur);
  }

  $.fn.kala.keypress = function(e)
  {
    // get decimal character and determine if negatives are allowed
    var jackBauer = $.data(this, "kala.jackBauer");
    // get the key that was pressed
    var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
    // allow enter/return key (only when in an input box)
    if (key == 13 && this.nodeName.toLowerCase() == "input") {
      return true;
    } else if (key == 13) {
      return false;
    }
    var allow = false;
    // allow Ctrl+A
    if ((e.ctrlKey && key == 97 /* firefox */) || (e.ctrlKey && key == 65) /* opera */) return true;
    // allow Ctrl+X (cut)
    if ((e.ctrlKey && key == 120 /* firefox */) || (e.ctrlKey && key == 88) /* opera */) return true;
    // allow Ctrl+C (copy)
    if ((e.ctrlKey && key == 99 /* firefox */) || (e.ctrlKey && key == 67) /* opera */) return true;
    // allow Ctrl+Z (undo)
    if ((e.ctrlKey && key == 122 /* firefox */) || (e.ctrlKey && key == 90) /* opera */) return true;
    // allow or deny Ctrl+V (paste), Shift+Ins
    if ((e.ctrlKey && key == 118 /* firefox */) || (e.ctrlKey && key == 86) /* opera */
       || (e.shiftKey && key == 45)) return true;
    // if a number was not pressed
    if (key < 48 || key > 57) {
      var value = $(this).val();
      /* ':' only allowed at 2nd or 3rd place. */
      if (value.indexOf(":") != 0 && key == 45 && (value.length < 3 || ($.fn.getSelectionStart(this)) < 3)) return true;
      // check for other keys that have special purposes
      //  8   backspace
      //  9   tab
      //  13  enter
      //  35  end 
      //  36  home
      //  37  left
      //  39  right
      //  46  del
      if ($.inArray([8, 9, 13, 35, 36, 37, 39, 46], key))  {
        // for detecting special keys (listed above)
        // IE does not support 'charCode' and ignores them in keypress anyway
        if (typeof e.charCode != "undefined") {
	  // special keys have 'keyCode' and 'which' the same (e.g. backspace)
	  if (e.keyCode == e.which && e.which != 0) {
	    allow = true;
	    // . and delete share the same code, don't allow . (will be set to true later if it is the decimal point)
	    if (e.which == 46) allow = false;
	  } else if (e.keyCode != 0 && e.charCode == 0 && e.which == 0) {
            // or keyCode != 0 and 'charCode'/'which' = 0
	    allow = true;
	  }
        }
      } else {
        allow = false
      }
      // if key pressed is the decimal and it is not already in the field
      if (decimal && key == decimal.charCodeAt(0)) {
        if (value.indexOf(decimal) == -1) {
	  allow = true;
        } else {
	  allow = false;
        }
      }
    } else {
      allow = true;
    }
    return allow;
  }

  $.fn.kala.keyup = function(e)
  {
    var val = $(this).value;
    if (val && val.length > 0) {
      // get carat (cursor) position
      var carat = $.fn.getSelectionStart(this);
      // get decimal character and determine if negatives are allowed
      var jackBauer = $.data(this, "kala.jackBauer");

      // prepend a 0 if necessary
      if (decimal != "") {
	// find decimal point
	var dot = val.indexOf(decimal);
	// if dot at start, add 0 before
	if (dot == 0)
	{
	  this.value = "0" + val;
	}
	// if dot at position 1, check if there is a - symbol before it
	if (dot == 1 && val.charAt(0) == "-")
	{
	  this.value = "-0" + val.substring(1);
	}
	val = this.value;
      }
      
      // if pasted in, only allow the following characters
      var validChars = [0,1,2,3,4,5,6,7,8,9,':'];
      // get length of the value (to loop through)
      var length = val.length;
      // loop backwards (to prevent going out of bounds)
      for (var i = length - 1; i >= 0; i--) {
	var ch = val.charAt(i);
	var validChar = false;
	// loop through validChars
	for(var j = 0; j < validChars.length; j++) {
	  // if it is valid, break out the loop
	  if (ch == validChars[j]) {
	    validChar = true;
	    break;
	  }
	}
	// if not a valid character, or a space, remove
	if (!validChar || ch == " ") {
	  val = val.substring(0, i) + val.substring(i + 1);
	}
      }
      // set the value and prevent the cursor moving to the end
      this.value = val;
      $.fn.setSelection(this, carat);
    }
  }

  $.fn.kala.blur = function()
  {
    var jackBauer = $.data(this, "kala.jackBauer");
    var callback = $.data(this, "kala.callback");
    var val = this.value;
    if (val != "") {
      var re = new RegExp("^\\d+{4}$|^\\d{,2}:\\d+{,2}$");
      if (!re.exec(val)) {
        // If there is a regex match error, call callback.
        callback.apply(this);
      }
    }
  }

  $.fn.removeKala = function()
  {
    return this.data("kala.24", null).data("kala.callback", null).unbind("keypress", $.fn.kala.keypress).unbind("blur", $.fn.kala.blur);
  }

  // Based on code from http://javascript.nwbox.com/cursor_position/ (Diego Perini <dperini@nwbox.com>)
  $.fn.getSelectionStart = function(o)
  {
    if (o.createTextRange) {
      var r = document.selection.createRange().duplicate();
      r.moveEnd('character', o.value.length);
      if (r.text == '') return o.value.length;
      return o.value.lastIndexOf(r.text);
    } else {
      return o.selectionStart;
    }
  }

  // set the selection, o is the object (input), p is the position ([start, end] or just start)
  $.fn.setSelection = function(o, p) {
    // if p is number, start and end are the same
    if (typeof p == "number") p = [p, p];
    // only set if p is an array of length 2
    if (p && p.constructor == Array && p.length == 2) {
      if (o.createTextRange) {
	var r = o.createTextRange();
	r.collapse(true);
	r.moveStart('character', p[0]);
	r.moveEnd('character', p[1]);
	r.select();
      } else if (o.setSelectionRange) {
	o.focus();
	o.setSelectionRange(p[0], p[1]);
      }
    }
  }

})(jQuery);
