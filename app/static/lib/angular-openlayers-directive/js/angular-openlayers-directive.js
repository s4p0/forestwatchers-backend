(function() {

"use strict";

/**
 * @license AngularJS v1.3.8
 * (c) 2010-2014 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular, undefined) {'use strict';

var $sanitizeMinErr = angular.$$minErr('$sanitize');

/**
 * @ngdoc module
 * @name ngSanitize
 * @description
 *
 * # ngSanitize
 *
 * The `ngSanitize` module provides functionality to sanitize HTML.
 *
 *
 * <div doc-module-components="ngSanitize"></div>
 *
 * See {@link ngSanitize.$sanitize `$sanitize`} for usage.
 */

/*
 * HTML Parser By Misko Hevery (misko@hevery.com)
 * based on:  HTML Parser By John Resig (ejohn.org)
 * Original code by Erik Arvidsson, Mozilla Public License
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 *
 * // Use like so:
 * htmlParser(htmlString, {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * });
 *
 */


/**
 * @ngdoc service
 * @name $sanitize
 * @kind function
 *
 * @description
 *   The input is sanitized by parsing the HTML into tokens. All safe tokens (from a whitelist) are
 *   then serialized back to properly escaped html string. This means that no unsafe input can make
 *   it into the returned string, however, since our parser is more strict than a typical browser
 *   parser, it's possible that some obscure input, which would be recognized as valid HTML by a
 *   browser, won't make it through the sanitizer. The input may also contain SVG markup.
 *   The whitelist is configured using the functions `aHrefSanitizationWhitelist` and
 *   `imgSrcSanitizationWhitelist` of {@link ng.$compileProvider `$compileProvider`}.
 *
 * @param {string} html HTML input.
 * @returns {string} Sanitized HTML.
 *
 * @example
   <example module="sanitizeExample" deps="angular-sanitize.js">
   <file name="index.html">
     <script>
         angular.module('sanitizeExample', ['ngSanitize'])
           .controller('ExampleController', ['$scope', '$sce', function($scope, $sce) {
             $scope.snippet =
               '<p style="color:blue">an html\n' +
               '<em onmouseover="this.textContent=\'PWN3D!\'">click here</em>\n' +
               'snippet</p>';
             $scope.deliberatelyTrustDangerousSnippet = function() {
               return $sce.trustAsHtml($scope.snippet);
             };
           }]);
     </script>
     <div ng-controller="ExampleController">
        Snippet: <textarea ng-model="snippet" cols="60" rows="3"></textarea>
       <table>
         <tr>
           <td>Directive</td>
           <td>How</td>
           <td>Source</td>
           <td>Rendered</td>
         </tr>
         <tr id="bind-html-with-sanitize">
           <td>ng-bind-html</td>
           <td>Automatically uses $sanitize</td>
           <td><pre>&lt;div ng-bind-html="snippet"&gt;<br/>&lt;/div&gt;</pre></td>
           <td><div ng-bind-html="snippet"></div></td>
         </tr>
         <tr id="bind-html-with-trust">
           <td>ng-bind-html</td>
           <td>Bypass $sanitize by explicitly trusting the dangerous value</td>
           <td>
           <pre>&lt;div ng-bind-html="deliberatelyTrustDangerousSnippet()"&gt;
&lt;/div&gt;</pre>
           </td>
           <td><div ng-bind-html="deliberatelyTrustDangerousSnippet()"></div></td>
         </tr>
         <tr id="bind-default">
           <td>ng-bind</td>
           <td>Automatically escapes</td>
           <td><pre>&lt;div ng-bind="snippet"&gt;<br/>&lt;/div&gt;</pre></td>
           <td><div ng-bind="snippet"></div></td>
         </tr>
       </table>
       </div>
   </file>
   <file name="protractor.js" type="protractor">
     it('should sanitize the html snippet by default', function() {
       expect(element(by.css('#bind-html-with-sanitize div')).getInnerHtml()).
         toBe('<p>an html\n<em>click here</em>\nsnippet</p>');
     });

     it('should inline raw snippet if bound to a trusted value', function() {
       expect(element(by.css('#bind-html-with-trust div')).getInnerHtml()).
         toBe("<p style=\"color:blue\">an html\n" +
              "<em onmouseover=\"this.textContent='PWN3D!'\">click here</em>\n" +
              "snippet</p>");
     });

     it('should escape snippet without any filter', function() {
       expect(element(by.css('#bind-default div')).getInnerHtml()).
         toBe("&lt;p style=\"color:blue\"&gt;an html\n" +
              "&lt;em onmouseover=\"this.textContent='PWN3D!'\"&gt;click here&lt;/em&gt;\n" +
              "snippet&lt;/p&gt;");
     });

     it('should update', function() {
       element(by.model('snippet')).clear();
       element(by.model('snippet')).sendKeys('new <b onclick="alert(1)">text</b>');
       expect(element(by.css('#bind-html-with-sanitize div')).getInnerHtml()).
         toBe('new <b>text</b>');
       expect(element(by.css('#bind-html-with-trust div')).getInnerHtml()).toBe(
         'new <b onclick="alert(1)">text</b>');
       expect(element(by.css('#bind-default div')).getInnerHtml()).toBe(
         "new &lt;b onclick=\"alert(1)\"&gt;text&lt;/b&gt;");
     });
   </file>
   </example>
 */
function $SanitizeProvider() {
  this.$get = ['$$sanitizeUri', function($$sanitizeUri) {
    return function(html) {
      var buf = [];
      htmlParser(html, htmlSanitizeWriter(buf, function(uri, isImage) {
        return !/^unsafe/.test($$sanitizeUri(uri, isImage));
      }));
      return buf.join('');
    };
  }];
}

function sanitizeText(chars) {
  var buf = [];
  var writer = htmlSanitizeWriter(buf, angular.noop);
  writer.chars(chars);
  return buf.join('');
}


// Regular Expressions for parsing tags and attributes
var START_TAG_REGEXP =
       /^<((?:[a-zA-Z])[\w:-]*)((?:\s+[\w:-]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)\s*(>?)/,
  END_TAG_REGEXP = /^<\/\s*([\w:-]+)[^>]*>/,
  ATTR_REGEXP = /([\w:-]+)(?:\s*=\s*(?:(?:"((?:[^"])*)")|(?:'((?:[^'])*)')|([^>\s]+)))?/g,
  BEGIN_TAG_REGEXP = /^</,
  BEGING_END_TAGE_REGEXP = /^<\//,
  COMMENT_REGEXP = /<!--(.*?)-->/g,
  DOCTYPE_REGEXP = /<!DOCTYPE([^>]*?)>/i,
  CDATA_REGEXP = /<!\[CDATA\[(.*?)]]>/g,
  SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
  // Match everything outside of normal chars and " (quote character)
  NON_ALPHANUMERIC_REGEXP = /([^\#-~| |!])/g;


// Good source of info about elements and attributes
// http://dev.w3.org/html5/spec/Overview.html#semantics
// http://simon.html5.org/html-elements

// Safe Void Elements - HTML5
// http://dev.w3.org/html5/spec/Overview.html#void-elements
var voidElements = makeMap("area,br,col,hr,img,wbr");

// Elements that you can, intentionally, leave open (and which close themselves)
// http://dev.w3.org/html5/spec/Overview.html#optional-tags
var optionalEndTagBlockElements = makeMap("colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr"),
    optionalEndTagInlineElements = makeMap("rp,rt"),
    optionalEndTagElements = angular.extend({},
                                            optionalEndTagInlineElements,
                                            optionalEndTagBlockElements);

// Safe Block Elements - HTML5
var blockElements = angular.extend({}, optionalEndTagBlockElements, makeMap("address,article," +
        "aside,blockquote,caption,center,del,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5," +
        "h6,header,hgroup,hr,ins,map,menu,nav,ol,pre,script,section,table,ul"));

// Inline Elements - HTML5
var inlineElements = angular.extend({}, optionalEndTagInlineElements, makeMap("a,abbr,acronym,b," +
        "bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,q,ruby,rp,rt,s," +
        "samp,small,span,strike,strong,sub,sup,time,tt,u,var"));

// SVG Elements
// https://wiki.whatwg.org/wiki/Sanitization_rules#svg_Elements
var svgElements = makeMap("animate,animateColor,animateMotion,animateTransform,circle,defs," +
        "desc,ellipse,font-face,font-face-name,font-face-src,g,glyph,hkern,image,linearGradient," +
        "line,marker,metadata,missing-glyph,mpath,path,polygon,polyline,radialGradient,rect,set," +
        "stop,svg,switch,text,title,tspan,use");

// Special Elements (can contain anything)
var specialElements = makeMap("script,style");

var validElements = angular.extend({},
                                   voidElements,
                                   blockElements,
                                   inlineElements,
                                   optionalEndTagElements,
                                   svgElements);

//Attributes that have href and hence need to be sanitized
var uriAttrs = makeMap("background,cite,href,longdesc,src,usemap,xlink:href");

var htmlAttrs = makeMap('abbr,align,alt,axis,bgcolor,border,cellpadding,cellspacing,class,clear,' +
    'color,cols,colspan,compact,coords,dir,face,headers,height,hreflang,hspace,' +
    'ismap,lang,language,nohref,nowrap,rel,rev,rows,rowspan,rules,' +
    'scope,scrolling,shape,size,span,start,summary,target,title,type,' +
    'valign,value,vspace,width');

// SVG attributes (without "id" and "name" attributes)
// https://wiki.whatwg.org/wiki/Sanitization_rules#svg_Attributes
var svgAttrs = makeMap('accent-height,accumulate,additive,alphabetic,arabic-form,ascent,' +
    'attributeName,attributeType,baseProfile,bbox,begin,by,calcMode,cap-height,class,color,' +
    'color-rendering,content,cx,cy,d,dx,dy,descent,display,dur,end,fill,fill-rule,font-family,' +
    'font-size,font-stretch,font-style,font-variant,font-weight,from,fx,fy,g1,g2,glyph-name,' +
    'gradientUnits,hanging,height,horiz-adv-x,horiz-origin-x,ideographic,k,keyPoints,' +
    'keySplines,keyTimes,lang,marker-end,marker-mid,marker-start,markerHeight,markerUnits,' +
    'markerWidth,mathematical,max,min,offset,opacity,orient,origin,overline-position,' +
    'overline-thickness,panose-1,path,pathLength,points,preserveAspectRatio,r,refX,refY,' +
    'repeatCount,repeatDur,requiredExtensions,requiredFeatures,restart,rotate,rx,ry,slope,stemh,' +
    'stemv,stop-color,stop-opacity,strikethrough-position,strikethrough-thickness,stroke,' +
    'stroke-dasharray,stroke-dashoffset,stroke-linecap,stroke-linejoin,stroke-miterlimit,' +
    'stroke-opacity,stroke-width,systemLanguage,target,text-anchor,to,transform,type,u1,u2,' +
    'underline-position,underline-thickness,unicode,unicode-range,units-per-em,values,version,' +
    'viewBox,visibility,width,widths,x,x-height,x1,x2,xlink:actuate,xlink:arcrole,xlink:role,' +
    'xlink:show,xlink:title,xlink:type,xml:base,xml:lang,xml:space,xmlns,xmlns:xlink,y,y1,y2,' +
    'zoomAndPan');

var validAttrs = angular.extend({},
                                uriAttrs,
                                svgAttrs,
                                htmlAttrs);

function makeMap(str) {
  var obj = {}, items = str.split(','), i;
  for (i = 0; i < items.length; i++) obj[items[i]] = true;
  return obj;
}


/**
 * @example
 * htmlParser(htmlString, {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * });
 *
 * @param {string} html string
 * @param {object} handler
 */
function htmlParser(html, handler) {
  if (typeof html !== 'string') {
    if (html === null || typeof html === 'undefined') {
      html = '';
    } else {
      html = '' + html;
    }
  }
  var index, chars, match, stack = [], last = html, text;
  stack.last = function() { return stack[ stack.length - 1 ]; };

  while (html) {
    text = '';
    chars = true;

    // Make sure we're not in a script or style element
    if (!stack.last() || !specialElements[ stack.last() ]) {

      // Comment
      if (html.indexOf("<!--") === 0) {
        // comments containing -- are not allowed unless they terminate the comment
        index = html.indexOf("--", 4);

        if (index >= 0 && html.lastIndexOf("-->", index) === index) {
          if (handler.comment) handler.comment(html.substring(4, index));
          html = html.substring(index + 3);
          chars = false;
        }
      // DOCTYPE
      } else if (DOCTYPE_REGEXP.test(html)) {
        match = html.match(DOCTYPE_REGEXP);

        if (match) {
          html = html.replace(match[0], '');
          chars = false;
        }
      // end tag
      } else if (BEGING_END_TAGE_REGEXP.test(html)) {
        match = html.match(END_TAG_REGEXP);

        if (match) {
          html = html.substring(match[0].length);
          match[0].replace(END_TAG_REGEXP, parseEndTag);
          chars = false;
        }

      // start tag
      } else if (BEGIN_TAG_REGEXP.test(html)) {
        match = html.match(START_TAG_REGEXP);

        if (match) {
          // We only have a valid start-tag if there is a '>'.
          if (match[4]) {
            html = html.substring(match[0].length);
            match[0].replace(START_TAG_REGEXP, parseStartTag);
          }
          chars = false;
        } else {
          // no ending tag found --- this piece should be encoded as an entity.
          text += '<';
          html = html.substring(1);
        }
      }

      if (chars) {
        index = html.indexOf("<");

        text += index < 0 ? html : html.substring(0, index);
        html = index < 0 ? "" : html.substring(index);

        if (handler.chars) handler.chars(decodeEntities(text));
      }

    } else {
      html = html.replace(new RegExp("(.*)<\\s*\\/\\s*" + stack.last() + "[^>]*>", 'i'),
        function(all, text) {
          text = text.replace(COMMENT_REGEXP, "$1").replace(CDATA_REGEXP, "$1");

          if (handler.chars) handler.chars(decodeEntities(text));

          return "";
      });

      parseEndTag("", stack.last());
    }

    if (html == last) {
      throw $sanitizeMinErr('badparse', "The sanitizer was unable to parse the following block " +
                                        "of html: {0}", html);
    }
    last = html;
  }

  // Clean up any remaining tags
  parseEndTag();

  function parseStartTag(tag, tagName, rest, unary) {
    tagName = angular.lowercase(tagName);
    if (blockElements[ tagName ]) {
      while (stack.last() && inlineElements[ stack.last() ]) {
        parseEndTag("", stack.last());
      }
    }

    if (optionalEndTagElements[ tagName ] && stack.last() == tagName) {
      parseEndTag("", tagName);
    }

    unary = voidElements[ tagName ] || !!unary;

    if (!unary)
      stack.push(tagName);

    var attrs = {};

    rest.replace(ATTR_REGEXP,
      function(match, name, doubleQuotedValue, singleQuotedValue, unquotedValue) {
        var value = doubleQuotedValue
          || singleQuotedValue
          || unquotedValue
          || '';

        attrs[name] = decodeEntities(value);
    });
    if (handler.start) handler.start(tagName, attrs, unary);
  }

  function parseEndTag(tag, tagName) {
    var pos = 0, i;
    tagName = angular.lowercase(tagName);
    if (tagName)
      // Find the closest opened tag of the same type
      for (pos = stack.length - 1; pos >= 0; pos--)
        if (stack[ pos ] == tagName)
          break;

    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (i = stack.length - 1; i >= pos; i--)
        if (handler.end) handler.end(stack[ i ]);

      // Remove the open elements from the stack
      stack.length = pos;
    }
  }
}

var hiddenPre=document.createElement("pre");
var spaceRe = /^(\s*)([\s\S]*?)(\s*)$/;
/**
 * decodes all entities into regular string
 * @param value
 * @returns {string} A string with decoded entities.
 */
function decodeEntities(value) {
  if (!value) { return ''; }

  // Note: IE8 does not preserve spaces at the start/end of innerHTML
  // so we must capture them and reattach them afterward
  var parts = spaceRe.exec(value);
  var spaceBefore = parts[1];
  var spaceAfter = parts[3];
  var content = parts[2];
  if (content) {
    hiddenPre.innerHTML=content.replace(/</g,"&lt;");
    // innerText depends on styling as it doesn't display hidden elements.
    // Therefore, it's better to use textContent not to cause unnecessary
    // reflows. However, IE<9 don't support textContent so the innerText
    // fallback is necessary.
    content = 'textContent' in hiddenPre ?
      hiddenPre.textContent : hiddenPre.innerText;
  }
  return spaceBefore + content + spaceAfter;
}

/**
 * Escapes all potentially dangerous characters, so that the
 * resulting string can be safely inserted into attribute or
 * element text.
 * @param value
 * @returns {string} escaped text
 */
function encodeEntities(value) {
  return value.
    replace(/&/g, '&amp;').
    replace(SURROGATE_PAIR_REGEXP, function(value) {
      var hi = value.charCodeAt(0);
      var low = value.charCodeAt(1);
      return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
    }).
    replace(NON_ALPHANUMERIC_REGEXP, function(value) {
      return '&#' + value.charCodeAt(0) + ';';
    }).
    replace(/</g, '&lt;').
    replace(/>/g, '&gt;');
}

/**
 * create an HTML/XML writer which writes to buffer
 * @param {Array} buf use buf.jain('') to get out sanitized html string
 * @returns {object} in the form of {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * }
 */
function htmlSanitizeWriter(buf, uriValidator) {
  var ignore = false;
  var out = angular.bind(buf, buf.push);
  return {
    start: function(tag, attrs, unary) {
      tag = angular.lowercase(tag);
      if (!ignore && specialElements[tag]) {
        ignore = tag;
      }
      if (!ignore && validElements[tag] === true) {
        out('<');
        out(tag);
        angular.forEach(attrs, function(value, key) {
          var lkey=angular.lowercase(key);
          var isImage = (tag === 'img' && lkey === 'src') || (lkey === 'background');
          if (validAttrs[lkey] === true &&
            (uriAttrs[lkey] !== true || uriValidator(value, isImage))) {
            out(' ');
            out(key);
            out('="');
            out(encodeEntities(value));
            out('"');
          }
        });
        out(unary ? '/>' : '>');
      }
    },
    end: function(tag) {
        tag = angular.lowercase(tag);
        if (!ignore && validElements[tag] === true) {
          out('</');
          out(tag);
          out('>');
        }
        if (tag == ignore) {
          ignore = false;
        }
      },
    chars: function(chars) {
        if (!ignore) {
          out(encodeEntities(chars));
        }
      }
  };
}


// define ngSanitize module and register $sanitize service
angular.module('ngSanitize', []).provider('$sanitize', $SanitizeProvider);

/* global sanitizeText: false */

/**
 * @ngdoc filter
 * @name linky
 * @kind function
 *
 * @description
 * Finds links in text input and turns them into html links. Supports http/https/ftp/mailto and
 * plain email address links.
 *
 * Requires the {@link ngSanitize `ngSanitize`} module to be installed.
 *
 * @param {string} text Input text.
 * @param {string} target Window (_blank|_self|_parent|_top) or named frame to open links in.
 * @returns {string} Html-linkified text.
 *
 * @usage
   <span ng-bind-html="linky_expression | linky"></span>
 *
 * @example
   <example module="linkyExample" deps="angular-sanitize.js">
     <file name="index.html">
       <script>
         angular.module('linkyExample', ['ngSanitize'])
           .controller('ExampleController', ['$scope', function($scope) {
             $scope.snippet =
               'Pretty text with some links:\n'+
               'http://angularjs.org/,\n'+
               'mailto:us@somewhere.org,\n'+
               'another@somewhere.org,\n'+
               'and one more: ftp://127.0.0.1/.';
             $scope.snippetWithTarget = 'http://angularjs.org/';
           }]);
       </script>
       <div ng-controller="ExampleController">
       Snippet: <textarea ng-model="snippet" cols="60" rows="3"></textarea>
       <table>
         <tr>
           <td>Filter</td>
           <td>Source</td>
           <td>Rendered</td>
         </tr>
         <tr id="linky-filter">
           <td>linky filter</td>
           <td>
             <pre>&lt;div ng-bind-html="snippet | linky"&gt;<br>&lt;/div&gt;</pre>
           </td>
           <td>
             <div ng-bind-html="snippet | linky"></div>
           </td>
         </tr>
         <tr id="linky-target">
          <td>linky target</td>
          <td>
            <pre>&lt;div ng-bind-html="snippetWithTarget | linky:'_blank'"&gt;<br>&lt;/div&gt;</pre>
          </td>
          <td>
            <div ng-bind-html="snippetWithTarget | linky:'_blank'"></div>
          </td>
         </tr>
         <tr id="escaped-html">
           <td>no filter</td>
           <td><pre>&lt;div ng-bind="snippet"&gt;<br>&lt;/div&gt;</pre></td>
           <td><div ng-bind="snippet"></div></td>
         </tr>
       </table>
     </file>
     <file name="protractor.js" type="protractor">
       it('should linkify the snippet with urls', function() {
         expect(element(by.id('linky-filter')).element(by.binding('snippet | linky')).getText()).
             toBe('Pretty text with some links: http://angularjs.org/, us@somewhere.org, ' +
                  'another@somewhere.org, and one more: ftp://127.0.0.1/.');
         expect(element.all(by.css('#linky-filter a')).count()).toEqual(4);
       });

       it('should not linkify snippet without the linky filter', function() {
         expect(element(by.id('escaped-html')).element(by.binding('snippet')).getText()).
             toBe('Pretty text with some links: http://angularjs.org/, mailto:us@somewhere.org, ' +
                  'another@somewhere.org, and one more: ftp://127.0.0.1/.');
         expect(element.all(by.css('#escaped-html a')).count()).toEqual(0);
       });

       it('should update', function() {
         element(by.model('snippet')).clear();
         element(by.model('snippet')).sendKeys('new http://link.');
         expect(element(by.id('linky-filter')).element(by.binding('snippet | linky')).getText()).
             toBe('new http://link.');
         expect(element.all(by.css('#linky-filter a')).count()).toEqual(1);
         expect(element(by.id('escaped-html')).element(by.binding('snippet')).getText())
             .toBe('new http://link.');
       });

       it('should work with the target property', function() {
        expect(element(by.id('linky-target')).
            element(by.binding("snippetWithTarget | linky:'_blank'")).getText()).
            toBe('http://angularjs.org/');
        expect(element(by.css('#linky-target a')).getAttribute('target')).toEqual('_blank');
       });
     </file>
   </example>
 */
angular.module('ngSanitize').filter('linky', ['$sanitize', function($sanitize) {
  var LINKY_URL_REGEXP =
        /((ftp|https?):\/\/|(www\.)|(mailto:)?[A-Za-z0-9._%+-]+@)\S*[^\s.;,(){}<>"”’]/,
      MAILTO_REGEXP = /^mailto:/;

  return function(text, target) {
    if (!text) return text;
    var match;
    var raw = text;
    var html = [];
    var url;
    var i;
    while ((match = raw.match(LINKY_URL_REGEXP))) {
      // We can not end in these as they are sometimes found at the end of the sentence
      url = match[0];
      // if we did not match ftp/http/www/mailto then assume mailto
      if (!match[2] && !match[4]) {
        url = (match[3] ? 'http://' : 'mailto:') + url;
      }
      i = match.index;
      addText(raw.substr(0, i));
      addLink(url, match[0].replace(MAILTO_REGEXP, ''));
      raw = raw.substring(i + match[0].length);
    }
    addText(raw);
    return $sanitize(html.join(''));

    function addText(text) {
      if (!text) {
        return;
      }
      html.push(sanitizeText(text));
    }

    function addLink(url, text) {
      html.push('<a ');
      if (angular.isDefined(target)) {
        html.push('target="',
                  target,
                  '" ');
      }
      html.push('href="',
                url.replace(/"/g, '&quot;'),
                '">');
      addText(text);
      html.push('</a>');
    }
  };
}]);


})(window, window.angular);

angular.module('openlayers-directive', ['ngSanitize'])
       .directive('openlayers', ["$log", "$q", "$compile", "olHelpers", "olMapDefaults", "olData", function($log, $q, $compile, olHelpers, olMapDefaults, olData) {
    var _olMap;
    return {
        restrict: 'EA',
        transclude: true,
        replace: true,
        scope: {
            center: '=olCenter',
            defaults: '=olDefaults',
            layers: '=olLayers',
            view: '=olView',
            controls: '=olControls',
            events: '=olEvents'
        },
        template: '<div class="angular-openlayers-map"><div style="display: none;" ng-transclude></div></div>',
        controller: ["$scope", function($scope) {
            _olMap = $q.defer();
            this.getMap = function() {
                return _olMap.promise;
            };

            this.getOpenlayersScope = function() {
                return $scope;
            };
        }],

        link: function(scope, element, attrs) {
            var isDefined = olHelpers.isDefined;
            var createLayer = olHelpers.createLayer;
            var createView = olHelpers.createView;
            var defaults = olMapDefaults.setDefaults(scope.defaults, attrs.id);

            // Set width and height if they are defined
            if (isDefined(attrs.width)) {
                if (isNaN(attrs.width)) {
                    element.css('width', attrs.width);
                } else {
                    element.css('width', attrs.width + 'px');
                }
            }

            if (isDefined(attrs.height)) {
                if (isNaN(attrs.height)) {
                    element.css('height', attrs.height);
                } else {
                    element.css('height', attrs.height + 'px');
                }
            }

            var controls = ol.control.defaults(defaults.controls);
            var interactions = ol.interaction.defaults(defaults.interactions);
            var view = createView(defaults.view);

            // Create the Openlayers Map Object with the options
            var map = new ol.Map({
                target: element[0],
                controls: controls,
                interactions: interactions,
                renderer: defaults.renderer,
                view: view
            });

            // If we don't have to sync controls, set the controls in olData
            if (!isDefined(attrs.olControls)) {
                olData.setControls(map.getControls());
            }

            // If no layer is defined, set the default tileLayer
            if (!isDefined(attrs.olLayers)) {
                var layer = createLayer(defaults.layers.main);
                map.addLayer(layer);
                var olLayers = map.getLayers();
                olData.setLayers(olLayers, attrs.id);
            }

            if (!isDefined(attrs.olCenter)) {
                view.setCenter([defaults.center.lon, defaults.center.lat]);
                view.setZoom(defaults.center.zoom);
            }

            // Resolve the map object to the promises
            olData.setMap(map, attrs.id);
            _olMap.resolve(map);
        }
    };
}]);

angular.module('openlayers-directive').directive('olCenter', ["$log", "$location", "olMapDefaults", "olHelpers", function($log, $location, olMapDefaults, olHelpers) {
    return {
        restrict: 'A',
        scope: false,
        replace: false,
        require: 'openlayers',

        link: function(scope, element, attrs, controller) {
            var safeApply         = olHelpers.safeApply;
            var isValidCenter     = olHelpers.isValidCenter;
            var isDefined         = olHelpers.isDefined;
            var isArray           = olHelpers.isArray;
            var isNumber          = olHelpers.isNumber;
            var isSameCenterOnMap = olHelpers.isSameCenterOnMap;
            var setCenter         = olHelpers.setCenter;
            var setZoom           = olHelpers.setZoom;
            var olScope           = controller.getOpenlayersScope();

            controller.getMap().then(function(map) {
                var defaults = olMapDefaults.getDefaults(attrs.id);
                var view = map.getView();
                var center = olScope.center;

                if (attrs.olCenter.search('-') !== -1) {
                    $log.error('[AngularJS - Openlayers] The "center" variable can\'t use ' +
                               'a "-" on his key name: "' + attrs.center + '".');
                    setCenter(view, defaults.view.projection, defaults.center, map);
                    return;
                }

                if (!isDefined(center)) {
                    center = {};
                }

                if (!isValidCenter(center)) {
                    $log.warn('[AngularJS - Openlayers] invalid \'center\'');
                    center.lat = defaults.center.lat;
                    center.lon = defaults.center.lon;
                    center.zoom = defaults.center.zoom;
                    center.projection = defaults.center.projection;
                }

                if (!center.projection) {
                    if (defaults.view.projection !== 'pixel') {
                        center.projection = defaults.center.projection;
                    } else {
                        center.projection = 'pixel';
                    }
                }

                if (!isNumber(center.zoom)) {
                    center.zoom = 1;
                }

                setCenter(view, defaults.view.projection, center, map);
                view.setZoom(center.zoom);

                var centerUrlHash;
                if (center.centerUrlHash === true) {
                    var extractCenterFromUrl = function() {
                        var search = $location.search();
                        var centerParam;
                        if (isDefined(search.c)) {
                            var cParam = search.c.split(':');
                            if (cParam.length === 3) {
                                centerParam = {
                                    lat: parseFloat(cParam[0]),
                                    lon: parseFloat(cParam[1]),
                                    zoom: parseInt(cParam[2], 10)
                                };
                            }
                        }
                        return centerParam;
                    };
                    centerUrlHash = extractCenterFromUrl();

                    olScope.$on('$locationChangeSuccess', function() {
                        var urlCenter = extractCenterFromUrl();
                        if (urlCenter && !isSameCenterOnMap(urlCenter, map)) {
                            safeApply(olScope, function(scope) {
                                scope.center.lat = urlCenter.lat;
                                scope.center.lon = urlCenter.lon;
                                scope.center.zoom = urlCenter.zoom;
                            });
                        }
                    });
                }

                var geolocation;
                olScope.$watch('center', function(center) {

                    if (!center) {
                        return;
                    }

                    if (!center.projection) {
                        center.projection = defaults.center.projection;
                    }

                    if (center.autodiscover) {
                        if (!geolocation) {
                            geolocation = new ol.Geolocation({
                                projection: ol.proj.get(center.projection)
                            });

                            geolocation.on('change', function() {
                                console.log('hola');
                                if (center.autodiscover) {
                                    var location = geolocation.getPosition();
                                    safeApply(olScope, function(scope) {
                                        scope.center.lat = location[1];
                                        scope.center.lon = location[0];
                                        scope.center.zoom = 12;
                                        scope.center.autodiscover = false;
                                        geolocation.setTracking(false);
                                    });
                                }
                            });
                        }
                        geolocation.setTracking(true);
                        return;
                    }

                    if (!isValidCenter(center)) {
                        $log.warn('[AngularJS - Openlayers] invalid \'center\'');
                        center = defaults.center;
                    }

                    var viewCenter = view.getCenter();
                    if (viewCenter) {
                        if (defaults.view.projection === 'pixel') {
                            view.setCenter(center.coord);
                            return;
                        }
                        var actualCenter = ol.proj.transform(viewCenter, defaults.view.projection, center.projection);
                        if (!(actualCenter[1] === center.lat && actualCenter[0] === center.lon)) {
                            setCenter(view, defaults.view.projection, center, map);
                        }
                    }

                    if (view.getZoom() !== center.zoom) {
                        setZoom(view, center.zoom, map);
                    }
                }, true);

                map.on('moveend', function() {
                    safeApply(olScope, function(scope) {

                        if (!isDefined(scope.center)) {
                            return;
                        }

                        var center = map.getView().getCenter();
                        scope.center.zoom = view.getZoom();

                        if (defaults.view.projection === 'pixel') {
                            scope.center.coord = center;
                            return;
                        }

                        if (scope.center) {
                            var proj = ol.proj.transform(center, defaults.view.projection, scope.center.projection);
                            scope.center.lat = proj[1];
                            scope.center.lon = proj[0];

                            // Notify the controller about a change in the center position
                            olHelpers.notifyCenterUrlHashChanged(olScope, scope.center, $location.search());

                            // Calculate the bounds if needed
                            if (isArray(scope.center.bounds)) {
                                var extent = view.calculateExtent(map.getSize());
                                var centerProjection = scope.center.projection;
                                var viewProjection = defaults.view.projection;
                                scope.center.bounds = ol.proj.transform(extent, viewProjection, centerProjection);
                            }
                        }
                    });
                });

            });
        }
    };
}]);

angular.module('openlayers-directive').directive('olLayers', ["$log", "$q", "olData", "olMapDefaults", "olHelpers", function($log, $q, olData, olMapDefaults, olHelpers) {
    var _olLayers;

    return {
        restrict: 'A',
        scope: false,
        replace: false,
        require: 'openlayers',
        controller: function() {
            _olLayers = $q.defer();
            this.getLayers = function() {
                return _olLayers.promise;
            };
        },
        link: function(scope, element, attrs, controller) {
            var isDefined   = olHelpers.isDefined;
            var equals      = olHelpers.equals;
            var olLayers    = {};
            var olScope     = controller.getOpenlayersScope();
            var createLayer = olHelpers.createLayer;
            var createStyle = olHelpers.createStyle;
            var isBoolean   = olHelpers.isBoolean;

            controller.getMap().then(function(map) {
                var defaults = olMapDefaults.getDefaults(attrs.id);
                var projection = map.getView().getProjection();

                olScope.$watch('layers', function(layers, oldLayers) {
                    if (!isDefined(layers)) {
                        $log.warn('[AngularJS - OpenLayers] At least one layer has to be defined.');
                        layers = angular.copy(defaults.layers);
                    }

                    var layer = layers[Object.keys(layers)[0]];
                    var name;
                    if (!isDefined(layer) || !isDefined(layer.source) || !isDefined(layer.source.type)) {
                        $log.warn('[AngularJS - OpenLayers] At least one layer has to be defined.');
                        layers = angular.copy(defaults.layers);
                    }

                    var removeLayerFromMap = function(layer, map) {
                        var activeLayers = map.getLayers();
                        activeLayers.forEach(function(l) {
                            if (l === layer) {
                                map.removeLayer(layer);
                            }
                        });
                    };

                    // Delete non existent layers from the map
                    for (name in olLayers) {
                        layer = olLayers[name];
                        if (!layers.hasOwnProperty(name)) {
                            // Remove from the map if it's on it
                            removeLayerFromMap(layer, map);

                            delete olLayers[name];
                        }
                    }

                    // add new layers
                    for (name in layers) {
                        layer = layers[name];
                        var olLayer;
                        var style;

                        if (!isDefined(layer.visible)) {
                            layer.visible = true;
                        }

                        if (!isDefined(layer.opacity)) {
                            layer.opacity = 1;
                        }

                        if (!olLayers.hasOwnProperty(name)) {
                            olLayer = createLayer(layers[name], projection);
                            if (isDefined(olLayer)) {
                                olLayers[name] = olLayer;
                                map.addLayer(olLayer);

                                if (isBoolean(layer.visible)) {
                                    olLayer.setVisible(layer.visible);
                                }

                                if (layer.opacity) {
                                    olLayer.setOpacity(layer.opacity);
                                }

                                if (layer.style) {
                                    if (!angular.isFunction(layer.style)) {
                                        style = createStyle(layer.style);
                                    } else {
                                        style = layer.style;
                                    }
                                    olLayer.setStyle(style);
                                }
                            }
                        } else {
                            layer = layers[name];
                            var oldLayer = oldLayers[name];
                            olLayer = olLayers[name];
                            if (isDefined(oldLayer) && !equals(layer, oldLayer)) {
                                if (!equals(layer.source, oldLayer.source)) {

                                    var layerCollection = map.getLayers();

                                    for (var j = 0; j < layerCollection.getLength(); j++) {
                                        var l = layerCollection.item(j);
                                        if (l === olLayer) {
                                            layerCollection.removeAt(j);
                                            olLayer = createLayer(layer, projection);
                                            if (isDefined(olLayer)) {
                                                olLayers[name] = olLayer;
                                                layerCollection.insertAt(j, olLayer);
                                            }
                                        }
                                    }
                                }

                                if (isBoolean(layer.visible) && layer.visible !== oldLayer.visible) {
                                    olLayer.setVisible(layer.visible);
                                }

                                if (layer.opacity && layer.opacity !== oldLayer.opacity) {
                                    olLayer.setOpacity(layer.opacity);
                                }

                                if (layer.style && !equals(layer.style, oldLayer.style)) {
                                    if (!angular.isFunction(layer.style)) {
                                        style = createStyle(layer.style);
                                    } else {
                                        style = layer.style;
                                    }
                                    olLayer.setStyle(style);
                                }
                            }
                        }
                    }
                    // We can resolve the layer promises
                    _olLayers.resolve(olLayers);
                    olData.setLayers(olLayers, attrs.id);
                }, true);

            });
        }
    };
}]);

angular.module('openlayers-directive').directive('olEvents', ["$log", "$q", "olData", "olMapDefaults", "olHelpers", function($log, $q, olData, olMapDefaults, olHelpers) {
    return {
        restrict: 'A',
        scope: false,
        replace: false,
        require: ['openlayers', '?olLayers'],
        link: function(scope, element, attrs, controller) {
            var setEvents     = olHelpers.setEvents;
            var isDefined     = olHelpers.isDefined;
            var mapController = controller[0];
            var olScope       = mapController.getOpenlayersScope();

            mapController.getMap().then(function(map) {

                var getLayers;
                if (isDefined(controller[1]) && controller[1] !== null) {
                    getLayers = controller[1].getLayers;
                } else {
                    getLayers = function() {
                        var deferred = $q.defer();
                        deferred.resolve();
                        return deferred.promise;
                    };
                }

                getLayers().then(function(layers) {
                    olScope.$watch('events', function(events) {
                        setEvents(events, map, olScope, layers);
                    });
                });
            });
        }
    };
}]);

angular.module('openlayers-directive')
       .directive('olView', ["$log", "$q", "olData", "olMapDefaults", "olHelpers", function($log, $q, olData, olMapDefaults, olHelpers) {
    return {
        restrict: 'A',
        scope: false,
        replace: false,
        require: 'openlayers',
        link: function(scope, element, attrs, controller) {
            var olScope = controller.getOpenlayersScope();
            var isNumber = olHelpers.isNumber;
            var safeApply = olHelpers.safeApply;
            var createView = olHelpers.createView;

            controller.getMap().then(function(map) {
                var defaults = olMapDefaults.getDefaults(attrs.id);
                var view = olScope.view;

                if (!view.projection) {
                    view.projection = defaults.view.projection;
                }

                if (!view.maxZoom) {
                    view.maxZoom = defaults.view.maxZoom;
                }

                if (!view.minZoom) {
                    view.minZoom = defaults.view.minZoom;
                }

                if (!view.rotation) {
                    view.rotation = defaults.view.rotation;
                }

                var mapView = createView(view);
                map.setView(mapView);

                olScope.$watch('view', function(view) {
                    if (isNumber(view.rotation)) {
                        mapView.setRotation(view.rotation);
                    }
                }, true);

                mapView.on('change:rotation', function() {
                    safeApply(olScope, function(scope) {
                        scope.view.rotation = map.getView().getRotation();
                    });
                });

            });
        }
    };
}]);

angular.module('openlayers-directive')
       .directive('olControls', ["$log", "$q", "olData", "olMapDefaults", "olHelpers", function($log, $q, olData, olMapDefaults, olHelpers) {

    return {
        restrict: 'A',
        scope: false,
        replace: false,
        require: 'openlayers',
        link: function(scope, element, attrs, controller) {
            var olScope   = controller.getOpenlayersScope();

            controller.getMap().then(function(map) {
                var defaults = olMapDefaults.getDefaults(attrs.id);
                var detectControls = olHelpers.detectControls;
                var getControlClasses = olHelpers.getControlClasses;
                var controls = olScope.controls;

                for (var control in defaults.controls) {
                    if (!controls.hasOwnProperty(control)) {
                        controls[control] = defaults.controls[control];
                    }
                }

                olScope.$watch('controls', function(controls) {
                    var actualControls = detectControls(map.getControls());
                    var controlClasses = getControlClasses();
                    var c;

                    // Delete the controls removed
                    for (c in actualControls) {
                        if (!controls.hasOwnProperty(c) || controls[c] === false) {
                            map.removeControl(actualControls[c]);
                            delete actualControls[c];
                        }
                    }

                    for (c in controls) {
                        if ((controls[c] === true || angular.isObject(controls[c])) &&
                            !actualControls.hasOwnProperty(c)) {
                            map.addControl(new controlClasses[c]());
                        }
                    }
                }, true);
            });
        }
    };
}]);

angular.module('openlayers-directive')
       .directive('olMarker', ["$log", "$q", "olMapDefaults", "olHelpers", function($log, $q, olMapDefaults, olHelpers) {

    var getMarkerDefaults = function() {
        var base64icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAApCAYAAADAk4LOAAAGmklEQVRYw' +
                         '7VXeUyTZxjvNnfELFuyIzOabermMZEeQC/OclkO49CpOHXOLJl/CAURuYbQi3KLgEhbrhZ1aDwmaoGq' +
                         'KII6odATmH/scDFbdC7LvFqOCc+e95s2VG50X/LLm/f4/Z7neY/ne18aANCmAr5E/xZf1uDOkTcGcWR' +
                         '6hl9247tT5U7Y6SNvWsKT63P58qbfeLJG8M5qcgTknrvvrdDbsT7Ml+tv82X6vVxJE33aRmgSyYtcWV' +
                         'MqX97Yv2JvW39UhRE2HuyBL+t+gK1116ly06EeWFNlAmHxlQE0OMiV6mQCScusKRlhS3QLeVJdl1+23' +
                         'h5dY4FNB3thrbYboqptEFlphTC1hSpJnbRvxP4NWgsE5Jyz86QNNi/5qSUTGuFk1gu54tN9wuK2wc3o' +
                         '+Wc13RCmsoBwEqzGcZsxsvCSy/9wJKf7UWf1mEY8JWfewc67UUoDbDjQC+FqK4QqLVMGGR9d2wurKzq' +
                         'Bk3nqIT/9zLxRRjgZ9bqQgub+DdoeCC03Q8j+0QhFhBHR/eP3U/zCln7Uu+hihJ1+bBNffLIvmkyP0g' +
                         'pBZWYXhKussK6mBz5HT6M1Nqpcp+mBCPXosYQfrekGvrjewd59/GvKCE7TbK/04/ZV5QZYVWmDwH1mF' +
                         '3xa2Q3ra3DBC5vBT1oP7PTj4C0+CcL8c7C2CtejqhuCnuIQHaKHzvcRfZpnylFfXsYJx3pNLwhKzRAw' +
                         'AhEqG0SpusBHfAKkxw3w4627MPhoCH798z7s0ZnBJ/MEJbZSbXPhER2ih7p2ok/zSj2cEJDd4CAe+5W' +
                         'YnBCgR2uruyEw6zRoW6/DWJ/OeAP8pd/BGtzOZKpG8oke0SX6GMmRk6GFlyAc59K32OTEinILRJRcha' +
                         'h8HQwND8N435Z9Z0FY1EqtxUg+0SO6RJ/mmXz4VuS+DpxXC3gXmZwIL7dBSH4zKE50wESf8qwVgrP1E' +
                         'IlTO5JP9Igu0aexdh28F1lmAEGJGfh7jE6ElyM5Rw/FDcYJjWhbeiBYoYNIpc2FT/SILivp0F1ipDWk' +
                         '4BIEo2VuodEJUifhbiltnNBIXPUFCMpthtAyqws/BPlEF/VbaIxErdxPphsU7rcCp8DohC+GvBIPJS/' +
                         'tW2jtvTmmAeuNO8BNOYQeG8G/2OzCJ3q+soYB5i6NhMaKr17FSal7GIHheuV3uSCY8qYVuEm1cOzqdW' +
                         'r7ku/R0BDoTT+DT+ohCM6/CCvKLKO4RI+dXPeAuaMqksaKrZ7L3FE5FIFbkIceeOZ2OcHO6wIhTkNo0' +
                         'ffgjRGxEqogXHYUPHfWAC/lADpwGcLRY3aeK4/oRGCKYcZXPVoeX/kelVYY8dUGf8V5EBRbgJXT5QIP' +
                         'hP9ePJi428JKOiEYhYXFBqou2Guh+p/mEB1/RfMw6rY7cxcjTrneI1FrDyuzUSRm9miwEJx8E/gUmql' +
                         'yvHGkneiwErR21F3tNOK5Tf0yXaT+O7DgCvALTUBXdM4YhC/IawPU+2PduqMvuaR6eoxSwUk75ggqsY' +
                         'J7VicsnwGIkZBSXKOUww73WGXyqP+J2/b9c+gi1YAg/xpwck3gJuucNrh5JvDPvQr0WFXf0piyt8f8/' +
                         'WI0hV4pRxxkQZdJDfDJNOAmM0Ag8jyT6hz0WGXWuP94Yh2jcfjmXAGvHCMslRimDHYuHuDsy2QtHuIa' +
                         'vznhbYURq5R57KpzBBRZKPJi8eQg48h4j8SDdowifdIrEVdU+gbO6QNvRRt4ZBthUaZhUnjlYObNagV' +
                         '3keoeru3rU7rcuceqU1mJBxy+BWZYlNEBH+0eH4vRiB+OYybU2hnblYlTvkHinM4m54YnxSyaZYSF6R' +
                         '3jwgP7udKLGIX6r/lbNa9N6y5MFynjWDtrHd75ZvTYAPO/6RgF0k76mQla3FGq7dO+cH8sKn0Vo7nDl' +
                         'lwAhqwLPkxrHwWmHJOo+AKJ4rab5OgrM7rVu8eWb2Pu0Dh4eDgXoOfvp7Y7QeqknRmvcTBEyq9m/HQQ' +
                         'SCSz6LHq3z0yzsNySRfMS253wl2KyRDbcZPcfJKjZmSEOjcxyi+Y8dUOtsIEH6R2wNykdqrkYJ0RV92' +
                         'H0W58pkfQk7cKevsLK10Py8SdMGfXNXATY+pPbyJR/ET6n9nIfztNtZYRV9XniQu9IA2vOVgy4ir7GC' +
                         'LVmmd+zjkH0eAF9Po6K61pmCXHxU5rHMYd1ftc3owjwRSVRzLjKvqZEty6cRUD7jGqiOdu5HG6MdHjN' +
                         'cNYGqfDm5YRzLBBCCDl/2bk8a8gdbqcfwECu62Fg/HrggAAAABJRU5ErkJggg==';
        return {
            projection: 'EPSG:4326',
            lat: 0,
            lon: 0,
            coord: [],
            focus: true,
            showOnMouseOver: false,
            style: new ol.style.Style({
                image: new ol.style.Icon({
                    anchor: [0.5, 1],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                    opacity: 0.90,
                    src: base64icon
                })
            })
        };
    };

    return {
        restrict: 'E',
        scope: {
            lat: '=lat',
            lon: '=lon',
            label: '=label',
            properties: '=olMarkerProperties'
        },
        require: ['^openlayers', '?^olLayers'],
        replace: true,
        template: '<div class="popup-label" ng-bind-html="message"></div>',

        link: function(scope, element, attrs, controllers) {
            var isDefined = olHelpers.isDefined;
            var olScope = controllers[0];
            var createMarkerLayer = olHelpers.createMarkerLayer;
            var createMarker = olHelpers.createMarker;
            var createOverlay = olHelpers.createOverlay;

            var getLayers;
            // If the layers attribute is used, we must wait until the layers are created
            if (isDefined(controllers[1]) && controllers[1] !== null) {
                getLayers = controllers[1].getLayers;
            } else {
                getLayers = function() {
                    var deferred = $q.defer();
                    deferred.resolve();
                    return deferred.promise;
                };
            }

            olScope.getMap().then(function(map) {
                getLayers().then(function() {
                    // Create the markers layer and add it to the map
                    var markerLayer = createMarkerLayer();
                    map.addLayer(markerLayer);

                    var data = getMarkerDefaults();
                    var mapDefaults = olMapDefaults.getDefaults(attrs.id);
                    var viewProjection = mapDefaults.view.projection;
                    var label;
                    var pos;
                    var marker;

                    scope.$on('$destroy', function() {
                        map.removeLayer(markerLayer);
                    });

                    if (!isDefined(scope.properties)) {
                        data.lat = scope.lat ? scope.lat : data.lat;
                        data.lon = scope.lon ? scope.lon : data.lon;
                        data.message = attrs.message;

                        marker = createMarker(data, viewProjection);
                        if (!isDefined(marker)) {
                            $log.error('[AngularJS - Openlayers] Received invalid data on ' +
                                       'the marker.');
                        }
                        markerLayer.getSource().addFeature(marker);

                        if (data.message) {
                            scope.message = attrs.message;
                            pos = ol.proj.transform([data.lon, data.lat], data.projection, viewProjection);
                            label = createOverlay(element, pos);
                            map.addOverlay(label);
                        }
                        return;
                    }

                    scope.$watch('properties', function(properties) {
                        if (!isDefined(marker)) {
                            data.projection = properties.projection ? properties.projection : data.projection;
                            data.coord = properties.coord ? properties.coord : data.coord;
                            data.lat = properties.lat ? properties.lat : data.lat;
                            data.lon = properties.lon ? properties.lon : data.lon;

                            marker = createMarker(data, viewProjection);
                            if (!isDefined(marker)) {
                                $log.error('[AngularJS - Openlayers] Received invalid data on ' +
                                           'the marker.');
                            }
                            markerLayer.getSource().addFeature(marker);
                        }

                        if (isDefined(label)) {
                            map.removeOverlay(label);
                        }

                        scope.message = properties.label.message;
                        if (!isDefined(scope.message) || scope.message.length === 0) {
                            return;
                        }

                        if (properties.label && properties.label.focus === true) {
                            if (data.projection === 'pixel') {
                                pos = data.coord;
                            } else {
                                pos = ol.proj.transform([data.lon, data.lat], data.projection, viewProjection);
                            }
                            label = createOverlay(element, pos);
                            map.addOverlay(label);
                        }

                        if (label && properties.label && properties.label.focus === false) {
                            map.removeOverlay(label);
                            label = undefined;
                        }

                        if (properties.label && properties.label.focus === false && properties.label.showOnMouseOver) {
                            map.getViewport().addEventListener('mousemove', function(evt) {
                                if (properties.label.focus) {
                                    return;
                                }
                                var found = false;
                                var pixel = map.getEventPixel(evt);
                                var feature = map.forEachFeatureAtPixel(pixel, function(feature) {
                                    return feature;
                                });

                                if (feature === marker) {
                                    found = true;
                                    if (!isDefined(label)) {
                                        if (data.projection === 'pixel') {
                                            pos = data.coord;
                                        } else {
                                            pos = ol.proj.transform([data.lon, data.lat],
                                                                    data.projection, viewProjection);
                                        }
                                        label = createOverlay(element, pos);
                                        map.addOverlay(label);
                                    }
                                    map.getTarget().style.cursor = 'pointer';
                                }

                                if (!found && label) {
                                    map.removeOverlay(label);
                                    label = undefined;
                                    map.getTarget().style.cursor = '';
                                }
                            });
                        }
                    }, true);
                });
            });
        }
    };
}]);

angular.module('openlayers-directive').service('olData', ["$log", "$q", "olHelpers", function($log, $q, olHelpers) {
    var obtainEffectiveMapId = olHelpers.obtainEffectiveMapId;

    var maps = {};
    var layers = {};
    var markers = {};
    var controls = {};

    var setResolvedDefer = function(d, mapId) {
        var id = obtainEffectiveMapId(d, mapId);
        d[id].resolvedDefer = true;
    };

    var getUnresolvedDefer = function(d, mapId) {
        var id = obtainEffectiveMapId(d, mapId);
        var defer;

        if (!angular.isDefined(d[id]) || d[id].resolvedDefer === true) {
            defer = $q.defer();
            d[id] = {
                defer: defer,
                resolvedDefer: false
            };
        } else {
            defer = d[id].defer;
        }
        return defer;
    };

    var getDefer = function(d, mapId) {
        var id = obtainEffectiveMapId(d, mapId);
        var defer;

        if (!angular.isDefined(d[id]) || d[id].resolvedDefer === false) {
            defer = getUnresolvedDefer(d, mapId);
        } else {
            defer = d[id].defer;
        }
        return defer;
    };

    this.setMap = function(olMap, scopeId) {
        var defer = getUnresolvedDefer(maps, scopeId);
        defer.resolve(olMap);
        setResolvedDefer(maps, scopeId);
    };

    this.getMap = function(scopeId) {
        var defer = getDefer(maps, scopeId);
        return defer.promise;
    };

    this.getLayers = function(scopeId) {
        var defer = getDefer(layers, scopeId);
        return defer.promise;
    };

    this.setLayers = function(olLayers, scopeId) {
        var defer = getUnresolvedDefer(layers, scopeId);
        defer.resolve(olLayers);
        setResolvedDefer(layers, scopeId);
    };

    this.getMarkers = function(scopeId) {
        var defer = getDefer(markers, scopeId);
        return defer.promise;
    };

    this.setMarkers = function(olMarkers, scopeId) {
        var defer = getUnresolvedDefer(markers, scopeId);
        defer.resolve(olMarkers);
        setResolvedDefer(markers, scopeId);
    };

    this.getControls = function(scopeId) {
        var defer = getDefer(controls, scopeId);
        return defer.promise;
    };

    this.setControls = function(olControls, scopeId) {
        var defer = getUnresolvedDefer(controls, scopeId);
        defer.resolve(olControls);
        setResolvedDefer(controls, scopeId);
    };

}]);

angular.module('openlayers-directive').factory('olHelpers', ["$q", "$log", function($q, $log) {
    var isDefined = function(value) {
        return angular.isDefined(value);
    };

    var setEvent = function(map, eventType, scope) {
        if (eventType === 'pointermove') {
            map.on('pointermove', function(e) {
                var coord = e.coordinate;
                scope.$emit('openlayers.map.' + eventType, {
                    lat: coord[1],
                    lon: coord[0],
                    projection: map.getView().getProjection().getCode()
                });
            });
        } else if (eventType === 'singleclick') {
            map.on('singleclick', function(e) {
                var coord = e.coordinate;
                scope.$emit('openlayers.map.' + eventType, {
                    lat: coord[1],
                    lon: coord[0],
                    projection: map.getView().getProjection().getCode()
                });
            });
        }
    };

    var bingImagerySets = [
      'Road',
      'Aerial',
      'AerialWithLabels',
      'collinsBart',
      'ordnanceSurvey'
    ];

    var getControlClasses = function() {
        return {
            attribution: ol.control.Attribution,
            fullscreen: ol.control.FullScreen,
            mouseposition: ol.control.MousePosition,
            rotate: ol.control.Rotate,
            scaleline: ol.control.ScaleLine,
            zoom: ol.control.Zoom,
            zoomslider: ol.control.ZoomSlider,
            zoomtoextent: ol.control.ZoomToExtent
        };
    };

    var mapQuestLayers = ['osm', 'sat', 'hyb'];

    var createStyle = function(style) {
        var fill;
        var stroke;
        if (style.fill) {
            fill = new ol.style.Fill({
                color: style.fill.color
            });
        }

        if (style.stroke) {
            stroke = new ol.style.Stroke({
                color: style.stroke.color,
                width: style.stroke.width
            });
        }
        return new ol.style.Style({
            fill: fill,
            stroke: stroke
        });
    };

    var detectLayerType = function(layer) {
        if (layer.type) {
            return layer.type;
        } else {
            switch (layer.source.type) {
                case 'ImageWMS':
                    return 'Image';
                case 'ImageStatic':
                    return 'Image';
                case 'GeoJSON':
                    return 'Vector';
                case 'TopoJSON':
                    return 'Vector';
                default:
                    return 'Tile';
            }
        }
    };

    var createProjection = function(view) {
        var oProjection;

        switch (view.projection) {
            case 'pixel':
                if (!isDefined(view.extent)) {
                    $log.error('[AngularJS - Openlayers] - You must provide the extent of the image ' +
                               'if using pixel projection');
                    return;
                }
                oProjection = new ol.proj.Projection({
                    code: 'pixel',
                    units: 'pixels',
                    extent: view.extent
                });
                break;
            default:
                oProjection = new ol.proj.get(view.projection);
                break;
        }

        return oProjection;
    };

    var isValidStamenLayer = function(layer) {
        return ['watercolor', 'terrain', 'toner'].indexOf(layer) !== -1;
    };

    var createSource = function(source, projection) {
        var oSource;

        switch (source.type) {
            case 'ImageWMS':
                if (!source.url || !source.params) {
                    $log.error('[AngularJS - Openlayers] - ImageWMS Layer needs ' +
                               'valid server url and params properties');
                }
                oSource = new ol.source.ImageWMS({
                  url: source.url,
                  crossOrigin: source.crossOrigin ? source.crossOrigin : 'anonymous',
                  params: source.params
                });
                break;

            case 'TileWMS':
                if (!source.url || !source.params) {
                    $log.error('[AngularJS - Openlayers] - TileWMS Layer needs valid url and params properties');
                }
                oSource = new ol.source.TileWMS({
                  url: source.url,
                  crossOrigin: source.crossOrigin ? source.crossOrigin : 'anonymous',
                  params: source.params
                });
                break;
            case 'OSM':
                if (source.attribution) {
                    oSource = new ol.source.OSM({
                        attributions: [
                          new ol.Attribution({ html: source.attribution }),
                          ol.source.OSM.DATA_ATTRIBUTION
                        ]
                    });
                } else {
                    oSource = new ol.source.OSM();
                }

                if (source.url) {
                    oSource.setUrl(source.url);
                }

                break;
            case 'BingMaps':
                if (!source.key) {
                    $log.error('[AngularJS - Openlayers] - You need an API key to show the Bing Maps.');
                    return;
                }

                oSource = new ol.source.BingMaps({
                    key: source.key,
                    imagerySet: source.imagerySet ? source.imagerySet : bingImagerySets[0]
                });

                break;

            case 'MapQuest':
                if (!source.layer || mapQuestLayers.indexOf(source.layer) === -1) {
                    $log.error('[AngularJS - Openlayers] - MapQuest layers needs a valid \'layer\' property.');
                    return;
                }

                oSource = new ol.source.MapQuest({
                    layer: source.layer
                });

                break;

            case 'GeoJSON':
                if (!(source.geojson || source.url)) {
                    $log.error('[AngularJS - Openlayers] - You need a geojson ' +
                               'property to add a GeoJSON layer.');
                    return;
                }

                if (source.url) {
                    oSource = new ol.source.GeoJSON({
                        projection: projection,
                        url: source.url
                    });
                } else {
                    if (!isDefined(source.geojson.projection)) {
                        source.geojson.projection = projection;
                    }
                    oSource = new ol.source.GeoJSON(source.geojson);
                }

                break;
            case 'TopoJSON':
                if (!(source.topojson || source.url)) {
                    $log.error('[AngularJS - Openlayers] - You need a topojson ' +
                               'property to add a TopoJSON layer.');
                    return;
                }

                if (source.url) {
                    oSource = new ol.source.TopoJSON({
                        projection: projection,
                        url: source.url
                    });
                } else {
                    oSource = new ol.source.TopoJSON(source.topojson);
                }
                break;
            case 'TileJSON':
                oSource = new ol.source.TileJSON({
                    url: source.url,
                    crossOrigin: 'anonymous'
                });
                break;
            case 'KML':
                oSource = new ol.source.KML({
                    url: source.url,
                    projection: source.projection,
                    radius: source.radius,
                    extractStyles: false,
                });
                break;
            case 'Stamen':
                if (!source.layer || !isValidStamenLayer(source.layer)) {
                    $log.error('[AngularJS - Openlayers] - You need a valid Stamen layer.');
                    return;
                }
                oSource = new ol.source.Stamen({
                    layer: source.layer
                });
                break;
            case 'ImageStatic':
                if (!source.url || !angular.isArray(source.imageSize) || source.imageSize.length !== 2) {
                    $log.error('[AngularJS - Openlayers] - You need a image URL to create a ImageStatic layer.');
                    return;
                }

                oSource = new ol.source.ImageStatic({
                    url: source.url,
                    imageSize: source.imageSize,
                    projection: projection,
                    imageExtent: projection.getExtent()
                });
                break;
        }

        return oSource;
    };

    return {
        // Determine if a reference is defined
        isDefined: isDefined,

        // Determine if a reference is a number
        isNumber: function(value) {
            return angular.isNumber(value);
        },

        createView: function(view) {
            var projection = createProjection(view);

            return new ol.View({
                projection: projection,
                maxZoom: view.maxZoom,
                minZoom: view.minZoom,
            });
        },

        // Determine if a reference is defined and not null
        isDefinedAndNotNull: function(value) {
            return angular.isDefined(value) && value !== null;
        },

        // Determine if a reference is a string
        isString: function(value) {
            return angular.isString(value);
        },

        // Determine if a reference is an array
        isArray: function(value) {
            return angular.isArray(value);
        },

        // Determine if a reference is an object
        isObject: function(value) {
            return angular.isObject(value);
        },

        // Determine if two objects have the same properties
        equals: function(o1, o2) {
            return angular.equals(o1, o2);
        },

        isValidCenter: function(center) {
            return angular.isDefined(center) &&
                   (typeof center.autodiscover === 'boolean' ||
                    angular.isNumber(center.lat) && angular.isNumber(center.lon) ||
                   (angular.isArray(center.coord) && center.coord.length === 2 &&
                    angular.isNumber(center.coord[0]) && angular.isNumber(center.coord[1])) ||
                   (angular.isArray(center.bounds) && center.bounds.length === 4 &&
                   angular.isNumber(center.bounds[0]) && angular.isNumber(center.bounds[1]) &&
                   angular.isNumber(center.bounds[1]) && angular.isNumber(center.bounds[2])));
        },

        safeApply: function($scope, fn) {
            var phase = $scope.$root.$$phase;
            if (phase === '$apply' || phase === '$digest') {
                $scope.$eval(fn);
            } else {
                $scope.$apply(fn);
            }
        },

        isSameCenterOnMap: function(center, map) {
            var mapCenter = map.getView().getCenter();
            var zoom = map.getView().getZoom();
            if (mapCenter[1].toFixed(4) === center.lat.toFixed(4) &&
                mapCenter[1].toFixed(4) === center.lon.toFixed(4) &&
                zoom === center.zoom) {
                return true;
            }
            return false;
        },

        setCenter: function(view, projection, newCenter, map) {

            if (map && view.getCenter()) {
                var pan = ol.animation.pan({
                    duration: 150,
                    source: (view.getCenter())
                });
                map.beforeRender(pan);
            }

            if (newCenter.projection === projection) {
                view.setCenter([newCenter.lon, newCenter.lat]);
            } else {
                var coord = [newCenter.lon, newCenter.lat];
                view.setCenter(ol.proj.transform(coord, newCenter.projection, projection));
            }
        },

        setZoom: function(view, zoom, map) {
            var z = ol.animation.zoom({
                duration: 150,
                resolution: map.getView().getResolution()
            });
            map.beforeRender(z);
            view.setZoom(zoom);
        },

        isBoolean: function(value) {
            return typeof value === 'boolean';
        },

        obtainEffectiveMapId: function(d, mapId) {
            var id;
            var i;
            if (!angular.isDefined(mapId)) {
                if (Object.keys(d).length === 1) {
                    for (i in d) {
                        if (d.hasOwnProperty(i)) {
                            id = i;
                        }
                    }
                } else if (Object.keys(d).length === 0) {
                    id = 'main';
                } else {
                    $log.error('[AngularJS - Openlayers] - You have more than 1 map on the DOM, ' +
                               'you must provide the map ID to the olData.getXXX call');
                }
            } else {
                id = mapId;
            }
            return id;
        },

        generateUniqueUID: function() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        },

        createStyle: createStyle,

        setEvents: function(events, map, scope, layers) {
            if (isDefined(events)) {

                if (angular.isArray(events.map)) {
                    for (var i in events.map) {
                        var event = events.map[i];
                        setEvent(map, event, scope);
                    }
                }

                if (isDefined(layers)) {
                    if (isDefined(events.layers) && angular.isArray(events.layers.vector)) {
                        angular.forEach(events.layers.vector, function(eventType) {
                            angular.element(map.getViewport()).on(eventType, function(evt) {
                                var pixel = map.getEventPixel(evt);
                                var feature = map.forEachFeatureAtPixel(pixel, function(feature) {
                                    return feature;
                                });
                                scope.$emit('openlayers.geojson.' + eventType, feature, evt);
                            });
                        });
                    }
                }
            }
        },

        detectLayerType: detectLayerType,

        createLayer: function(layer, projection) {
            var oLayer;
            var type = detectLayerType(layer);
            var oSource = createSource(layer.source, projection);
            if (!oSource) {
                return;
            }

            switch (type) {
                case 'Image':
                    oLayer = new ol.layer.Image({ source: oSource });
                    break;
                case 'Tile':
                    oLayer = new ol.layer.Tile({ source: oSource });
                    break;
                case 'Heatmap':
                    oLayer = new ol.layer.Heatmap({ source: oSource });
                    break;
                case 'Vector':
                    var style;
                    if (layer.style) {
                        if (angular.isFunction(layer.style)) {
                            style = layer.style;
                        } else {
                            style = createStyle(layer.style);
                        }
                    }

                    oLayer = new ol.layer.Vector({ source: oSource, style: style });
                    break;
            }

            if (angular.isNumber(layer.opacity)) {
                oLayer.setOpacity(layer.opacity);
            }
            return oLayer;
        },

        createMarkerLayer: function() {
            return new ol.layer.Vector({
                source: new ol.source.Vector()
            });
        },

        notifyCenterUrlHashChanged: function(scope, center, search) {
            if (center.centerUrlHash) {
                var centerUrlHash = center.lat.toFixed(4) + ':' + center.lon.toFixed(4) + ':' + center.zoom;
                if (!isDefined(search.c) || search.c !== centerUrlHash) {
                    scope.$emit('centerUrlHash', centerUrlHash);
                }
            }
        },

        getControlClasses: getControlClasses,

        detectControls: function(controls) {
            var actualControls = {};
            var controlClasses = getControlClasses();

            controls.forEach(function(control) {
                for (var i in controlClasses) {
                    if (control instanceof controlClasses[i]) {
                        actualControls[i] = control;
                    }
                }
            });

            return actualControls;
        },

        createMarker: function(data, viewProjection) {
            var geometry;
            if (viewProjection === 'pixel') {
                geometry = new ol.geom.Point(data.coord);
            } else {
                geometry = new ol.geom.Point([data.lon, data.lat])
                                          .transform(data.projection, viewProjection);
            }

            var marker = new ol.Feature({
                geometry: geometry
            });
            marker.setStyle(data.style);
            return marker;
        },

        createOverlay: function(element, pos) {
            var ov = new ol.Overlay({
                position: pos,
                element: element,
                positioning: 'center-left'
            });

            return ov;
        }
    };
}]);

angular.module('openlayers-directive').factory('olMapDefaults', ["$q", "olHelpers", function($q, olHelpers) {
    var _getDefaults = function() {
        return {
            view: {
                projection: 'EPSG:3857',
                minZoom: undefined,
                maxZoom: undefined,
                rotation: 0,
                extent: undefined
            },
            layers: {
                main: {
                    type: 'Tile',
                    source: {
                        type: 'OSM'
                    }
                }
            },
            center: {
                lat: 0,
                lon: 0,
                zoom: 1,
                autodiscover: false,
                bounds: [],
                centerUrlHash: false,
                projection: 'EPSG:4326'
            },
            events: {
                map: ['click']
            },
            controls: {
                attribution: true,
                rotate: false,
                zoom: true
            },
            renderer: 'canvas'
        };
    };

    var isDefined = olHelpers.isDefined;
    var obtainEffectiveMapId = olHelpers.obtainEffectiveMapId;
    var defaults = {};

    // Get the _defaults dictionary, and override the properties defined by the user
    return {
        getDefaults: function(scopeId) {
            var mapId = obtainEffectiveMapId(defaults, scopeId);
            return defaults[mapId];
        },

        setDefaults: function(userDefaults, scopeId) {
            var newDefaults = _getDefaults();

            if (isDefined(userDefaults)) {

                if (isDefined(userDefaults.layers)) {
                    newDefaults.layers = angular.copy(userDefaults.layers);
                }

                if (isDefined(userDefaults.controls)) {
                    newDefaults.controls = angular.copy(userDefaults.controls);
                }

                if (isDefined(userDefaults.interactions)) {
                    newDefaults.interactions = angular.copy(userDefaults.interactions);
                }

                if (isDefined(userDefaults.renderer)) {
                    newDefaults.renderer = userDefaults.renderer;
                }

                if (isDefined(userDefaults.view)) {
                    newDefaults.view.maxZoom = userDefaults.view.maxZoom || newDefaults.view.maxZoom;
                    newDefaults.view.minZoom = userDefaults.view.minZoom || newDefaults.view.minZoom;
                    newDefaults.view.projection = userDefaults.view.projection || newDefaults.view.projection;
                    newDefaults.view.extent = userDefaults.view.extent || newDefaults.view.extent;
                }

            }

            var mapId = obtainEffectiveMapId(defaults, scopeId);
            defaults[mapId] = newDefaults;
            return newDefaults;
        }
    };
}]);

}());