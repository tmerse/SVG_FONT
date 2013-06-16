$(function(){

  var canvas = $('#paperCvs')[0];
  paper.setup(canvas);

  var path;

  var textItem = new paper.PointText(new paper.Point(20, 55));

  var mTool = new paper.Tool();
  mTool.activate();

  mTool.onMouseDown = function (event) {
    // If we produced a path before, deselect it:
    if (path) {
      path.selected = false;
    }

    // Create a new path and set its stroke color to black:
    path = new paper.Path();
    path.add(event.point);
    path.strokeColor = 'black';

  };

  // While the user drags the mouse, points are added to the path
  // at the position of the mouse:
  mTool.onMouseDrag = function (event) {
    path.add(event.point);
  };

  // When the mouse is released, we simplify the path:
  mTool.onMouseUp = function (event) {
    path.simplify(20);
    // save changes
    addSvgChar(charArray, helpers.getCurChar());
  };

  // SVG-Font Logic
  // ==============

  var chars = "aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ.!? ";
  // this will contain the svg representation
  // of our characters, mapped against the
  // ascii table
  var charArray = svgData;

  // pseudo STRINGIFY and PARSE methods for
  // STRING and DOM NODE representation in context
  // of this tutorial
  var svg = {
    paper: paper,
    serializer: new XMLSerializer(),
    STRINGIFY: function (svgElem) {
      return this.serializer.serializeToString(svgElem);
    },
    // attach hidden svg element to DOM
    // making it available for paper.project.importSVG
    PARSE: function (svgStr) {
      $('#svgContainer').children(0).replaceWith(svgStr);
      return this.paper.project.importSVG($('#svgContainer').children(0)[0]);
    }
  };

  initControls();
  // draw "a"
  svg.PARSE(charArray[97]);
  paper.view.draw();

  // initialize controls
  function initControls () {
    // populate selectbox (#chars) with desired characters
    var charList = $.map((chars).split(''), function(char){
      return '<option value="' + char + '">' + char + '</option>';
    });
    $('#chars').replaceWith('<select id="chars">' + charList + '</select>');


    // generate clickhandlers to switch to prev/nextChar
    function loadSvgFont () {

      // get svg stringrepresentation
      var str = helpers.getSvgFromChar(charArray, helpers.getCurChar());
      if (str !== undefined) {
        svg.PARSE(str);
        paper.view.draw();
      }
    }

    function changeActiveChar (d) {

      var curIdx = $('#chars')[0].selectedIndex;
      var maxIdx = $('#chars').children().length;
      var newIdx;

      if (curIdx + d >= maxIdx || curIdx + d < 0) {
        return;

      } else {

        // save string representation of cur svgChar
        addSvgChar(charArray, helpers.getCurChar());

        $('#chars')[0].selectedIndex += d;
        $('#chars').data("prev", $('#chars').val());

        // clear context
        paper.project.activeLayer.removeChildren();
        paper.view.draw();

        loadSvgFont();
      }
    }

    // change selected character
    $('#nextChar').click(function () { changeActiveChar(+1); });
    $('#prevChar').click(function () { changeActiveChar(-1); });

    $('#chars').change(function () {
      addSvgChar(charArray, $(this).data("prev") || "a");

      paper.project.activeLayer.removeChildren();
      loadSvgFont();

      $(this).data("prev", $(this).val());
    });

  }

  // svg conversion operations
  $('#paperImport').click(function() {
    var svgElem = paper.project.exportSVG();
    var svgString = svg.STRINGIFY(svgElem);
  });

  $('#paperExport').click(function() {
    var svgElem = paper.project.exportSVG();
    var svgString = svg.STRINGIFY(svgElem);
    $('#svgContainer').children(0).replaceWith(svgString);
  });

  $('#clearContext').click(function() {
    paper.project.activeLayer.removeChildren();
    paper.view.draw();
  });

  /*
   * // ASCII -> Char
   * String.fromCharCode(num1,...,numN);
   * String.fromCharCode(65,66,67) // "ABC"
   * 
   * // Char-> ASCII 
   * // index >= 0; index < String.length
   * String.charCodeAt(index);
   */

  $('#addSvg').click(function() {
    addSvgChar(charArray, helpers.getCurChar());
  });

  function addSvgChar(arr, char) {
    var cpos = char.charCodeAt(0);
    arr[cpos] = svg.STRINGIFY(paper.project.exportSVG());
  }

  var helpers = {
    getCurChar: function () {
      return $('#chars').val();
    },
    getSvgFromChar: function (arr, char) {
      var cpos = char.charCodeAt(0);
      return arr[cpos];
    }
  };

  // two.js
  // ======

  // TODO: remove deltas from global scope
  // and integrate into myReplace function
  var dx, dy;
  function convertSVGString(testStr) {
    dx = 0;
    dy = 0;
    var str = charArray.join("");
    var output = "";

    var i = 0;
    for (i = 0; i < testStr.length; i++) {

      var el = testStr.charCodeAt(i);

      // space character
      if (el === 32) {
        dx += 50;
        continue;
        // linebreak
      } else if ( el === 10 ) {
        dx = 0;
        dy += 120;
        continue;
      }

      // var pos = el - 33;
      var pos = el;
      var tmp = "";
      dx += 50;

      tmp = charArray[pos];

      // remove open svg tag
      // ? = greedy
      tmp = tmp.replace(/^<svg.*?d="M/, '<path d="M');
      // remove closing svg tag
      tmp = tmp.replace(/<\/g><\/svg>/, '');
      // expand <path> tag with additional information
      tmp = tmp.replace(/<path/g, '<path fill="none" stroke-width="4"');
      tmp = tmp.replace(/d="M(\d*),(\d*)c/g, myReplace);
      output += tmp;
    }

    output = '<svg id="mysvg">' + output + '</svg>';
    return output;
  }

  function myReplace ( match, p1, p2, offset, string ) {
    p1 = 'd="M' + (parseInt(p1, 10) + dx);
    p2 = (parseInt(p2, 10) + dy) + 'c';
    return[p1, p2].join(',');
  }

  $('#render').click(function () {
    var testStr = $('#txtArea').val() || 'Hello\nWorld';

    for (var i = 0; i < testStr.length; i++) {
      // carriage return
      if (testStr[i].charCodeAt(0) === 10) {
        continue;
      } else if (chars.indexOf(testStr[i]) === -1) {
        alert("char \"" + testStr[i] + "\" not supported!");
        return testStr[i];
      }
    }

    // check for unsupported chars
    $('#svgContainer').children(0).replaceWith(convertSVGString(testStr));
    $('#wrapper').hide();
    $('#stop').show();
    activateTwo();
  });

  $('#stop').hide();
  $('#stop').click(function () {
    $('#wrapper').show();
    $(this).data('stop', true);
    $(this).hide();
  });

  $('#export').click(function () {
    var exportStr = JSON.stringify(charArray);
    exportStr = '/* Your custom Font. Paste into src/svgData.js */\n\n' +
      'var svgData = ' + exportStr;
    $('#txtArea').text(exportStr);

  });

});
