;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);
  var index = path + '/index.js';

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
  }

  if (require.aliases.hasOwnProperty(index)) {
    return require.aliases[index];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-indexof/index.js", function(exports, require, module){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  fn._off = on;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var i = index(callbacks, fn._off || fn);
  if (~i) callbacks.splice(i, 1);
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("holla/dist/holla.js", function(exports, require, module){
// Generated by CoffeeScript 1.6.2
(function() {
  var Call, Client, holla, shims;

  Client = require('./Client');

  Call = require('./Call');

  shims = require('./shims');

  holla = {
    createClient: function(opt) {
      if (opt == null) {
        opt = {};
      }
      return new Client(opt);
    },
    Call: Call,
    Client: Client,
    supported: shims.supported,
    config: shims.PeerConnConfig,
    streamToBlob: function(s) {
      return shims.URL.createObjectURL(s);
    },
    pipe: function(stream, el) {
      var uri;

      uri = holla.streamToBlob(stream);
      return shims.attachStream(uri, el);
    },
    createStream: function(opt, cb) {
      var err, succ;

      if (shims.getUserMedia == null) {
        return cb("Missing getUserMedia");
      }
      err = cb;
      succ = function(s) {
        return cb(null, s);
      };
      shims.getUserMedia(opt, succ, err);
      return holla;
    },
    createFullStream: function(cb) {
      return holla.createStream({
        video: true,
        audio: true
      }, cb);
    },
    createVideoStream: function(cb) {
      return holla.createStream({
        video: true,
        audio: false
      }, cb);
    },
    createAudioStream: function(cb) {
      return holla.createStream({
        video: false,
        audio: true
      }, cb);
    }
  };

  module.exports = holla;

}).call(this);

});
require.register("holla/dist/Client.js", function(exports, require, module){
// Generated by CoffeeScript 1.6.2
(function() {
  var Call, Client, Emitter, socketio,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Emitter = require('emitter');

  socketio = io;

  Call = require('./Call');

  Client = (function(_super) {
    __extends(Client, _super);

    function Client(options) {
      var _this = this;

      this.options = options != null ? options : {};
      this.io = socketio.connect(this.options.host);
      this.io.on('reconnect', function() {
        return _this.emit('reconnect');
      });
      this.io.on('disconnect', function() {
        return _this.emit('disconnect');
      });
      this.io.on('error', function(err) {
        return _this.emit('error', err);
      });
      this.io.on('callRequest', function(callInfo) {
        var call;

        call = new Call(_this, callInfo.id);
        return _this.emit("call", call);
      });
    }

    Client.prototype.createCall = function(cb) {
      var _this = this;

      this.io.emit('createCall', function(err, id) {
        var call;

        if (err != null) {
          return cb(err);
        }
        call = new Call(_this, id, true);
        return cb(null, call);
      });
      return this;
    };

    Client.prototype.register = function(name, cb) {
      return this.io.emit('register', name, cb);
    };

    Client.prototype.unregister = function(cb) {
      return this.io.emit('unregister', cb);
    };

    return Client;

  })(Emitter);

  module.exports = Client;

}).call(this);

});
require.register("holla/dist/Call.js", function(exports, require, module){
// Generated by CoffeeScript 1.6.2
(function() {
  var Call, Emitter, User, shims,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  shims = require('./shims');

  Emitter = require('emitter');

  User = (function(_super) {
    __extends(User, _super);

    function User(call, name) {
      this.call = call;
      this.name = name;
    }

    return User;

  })(Emitter);

  Call = (function(_super) {
    __extends(Call, _super);

    function Call(client, id, isCaller) {
      this.client = client;
      this.id = id;
      this.isCaller = isCaller != null ? isCaller : false;
      this.unmute = __bind(this.unmute, this);
      this.mute = __bind(this.mute, this);
      this.releaseLocalStream = __bind(this.releaseLocalStream, this);
      this.setLocalStream = __bind(this.setLocalStream, this);
      this.add = __bind(this.add, this);
      this.decline = __bind(this.decline, this);
      this.answer = __bind(this.answer, this);
      this._addUser = __bind(this._addUser, this);
      this.client.io.on("" + this.id + ":userAdded", this.addUser);
    }

    Call.prototype._addUser = function(name) {
      this.users[name] = new User(this.call, name);
      return this;
    };

    Call.prototype.answer = function() {
      this.client.io.emit("" + this.id + ":callResponse", true);
      return this;
    };

    Call.prototype.decline = function() {
      this.client.io.emit("" + this.id + ":callResponse", false);
      return this;
    };

    Call.prototype.add = function(name, cb) {
      this.client.io.emit("addUser", this.id, name, cb);
      return this;
    };

    Call.prototype.setLocalStream = function(stream) {
      this.localStream = stream;
      return this;
    };

    Call.prototype.releaseLocalStream = function() {
      this.localStream.stop();
      delete this.localStream;
      return this;
    };

    Call.prototype.mute = function() {
      var track, _i, _len, _ref;

      if (!this.localStream) {
        return this;
      }
      _ref = this.localStream.getAudioTracks();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        track = _ref[_i];
        track.enabled = false;
      }
      return this;
    };

    Call.prototype.unmute = function() {
      var track, _i, _len, _ref;

      if (!this.localStream) {
        return this;
      }
      _ref = this.localStream.getAudioTracks();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        track = _ref[_i];
        track.enabled = true;
      }
      return this;
    };

    return Call;

  })(Emitter);

  module.exports = Call;

}).call(this);

});
require.register("holla/dist/shims.js", function(exports, require, module){
// Generated by CoffeeScript 1.6.2
(function() {
  var IceCandidate, MediaStream, PeerConnection, SessionDescription, URL, attachStream, browser, extract, getUserMedia, processSDPIn, processSDPOut, removeCN, replaceCodec, shim, supported, useOPUS;

  PeerConnection = window.mozRTCPeerConnection || window.PeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection;

  IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;

  SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;

  MediaStream = window.MediaStream || window.webkitMediaStream;

  getUserMedia = navigator.mozGetUserMedia || navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia;

  URL = window.URL || window.webkitURL || window.msURL || window.oURL;

  if (getUserMedia != null) {
    getUserMedia = getUserMedia.bind(navigator);
  }

  browser = (navigator.mozGetUserMedia ? 'firefox' : 'chrome');

  supported = (PeerConnection != null) && (getUserMedia != null);

  extract = function(str, reg) {
    var match;

    match = str.match(reg);
    return (match != null ? match[1] : null);
  };

  replaceCodec = function(line, codec) {
    var el, els, idx, out, _i, _len;

    els = line.split(' ');
    out = [];
    for (idx = _i = 0, _len = els.length; _i < _len; idx = ++_i) {
      el = els[idx];
      if (idx === 3) {
        out[idx++] = codec;
      }
      if (el !== codec) {
        out[idx++] = el;
      }
    }
    return out.join(' ');
  };

  removeCN = function(lines, mLineIdx) {
    var cnPos, idx, line, mLineEls, payload, _i, _len;

    mLineEls = lines[mLineIdx].split(' ');
    for (idx = _i = 0, _len = lines.length; _i < _len; idx = ++_i) {
      line = lines[idx];
      if (!(line != null)) {
        continue;
      }
      payload = extract(line, /a=rtpmap:(\d+) CN\/\d+/i);
      if (payload != null) {
        cnPos = mLineEls.indexOf(payload);
        if (cnPos !== -1) {
          mLineEls.splice(cnPos, 1);
        }
        lines.splice(idx, 1);
      }
    }
    lines[mLineIdx] = mLineEls.join(' ');
    return lines;
  };

  useOPUS = function(sdp) {
    var idx, line, lines, mLineIdx, payload, _i, _len;

    lines = sdp.split('\r\n');
    mLineIdx = ((function() {
      var _i, _len, _results;

      _results = [];
      for (idx = _i = 0, _len = lines.length; _i < _len; idx = ++_i) {
        line = lines[idx];
        if (line.indexOf('m=audio') !== -1) {
          _results.push(idx);
        }
      }
      return _results;
    })())[0];
    if (mLineIdx == null) {
      return sdp;
    }
    for (idx = _i = 0, _len = lines.length; _i < _len; idx = ++_i) {
      line = lines[idx];
      if (!(line.indexOf('opus/48000') !== -1)) {
        continue;
      }
      payload = extract(line, /:(\d+) opus\/48000/i);
      if (payload != null) {
        lines[mLineIdx] = replaceCodec(lines[mLineIdx], payload);
      }
      break;
    }
    lines = removeCN(lines, mLineIdx);
    return lines.join('\r\n');
  };

  processSDPOut = function(sdp) {
    var addCrypto, line, out, _i, _j, _len, _len1, _ref, _ref1;

    out = [];
    if (browser === 'firefox') {
      addCrypto = "a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:BAADBAADBAADBAADBAADBAADBAADBAADBAADBAAD";
      _ref = sdp.split('\r\n');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        line = _ref[_i];
        out.push(line);
        if (line.indexOf('m=') === 0) {
          out.push(addCrypto);
        }
      }
    } else {
      _ref1 = sdp.split('\r\n');
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        line = _ref1[_j];
        if (line.indexOf("a=ice-options:google-ice") === -1) {
          out.push(line);
        }
      }
    }
    return useOPUS(out.join('\r\n'));
  };

  processSDPIn = function(sdp) {
    return sdp;
  };

  attachStream = function(uri, el) {
    var e, _i, _len;

    if (typeof el === "string") {
      return attachStream(uri, document.getElementById(el));
    } else if (el.jquery) {
      el.attr('src', uri);
      for (_i = 0, _len = el.length; _i < _len; _i++) {
        e = el[_i];
        e.play();
      }
    } else {
      el.src = uri;
      el.play();
    }
    return el;
  };

  shim = function() {
    var PeerConnConfig, mediaConstraints, out;

    if (!supported) {
      return;
    }
    if (browser === 'firefox') {
      PeerConnConfig = {
        iceServers: [
          {
            url: "stun:23.21.150.121"
          }
        ]
      };
      mediaConstraints = {
        mandatory: {
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: true,
          MozDontOfferDataChannel: true
        }
      };
      MediaStream.prototype.getVideoTracks = function() {
        return [];
      };
      MediaStream.prototype.getAudioTracks = function() {
        return [];
      };
    } else {
      PeerConnConfig = {
        iceServers: [
          {
            url: "stun:stun.l.google.com:19302"
          }
        ]
      };
      mediaConstraints = {
        mandatory: {
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: true
        },
        optional: [
          {
            DtlsSrtpKeyAgreement: true
          }
        ]
      };
      if (!MediaStream.prototype.getVideoTracks) {
        MediaStream.prototype.getVideoTracks = function() {
          return this.videoTracks;
        };
        MediaStream.prototype.getAudioTracks = function() {
          return this.audioTracks;
        };
      }
      if (!PeerConnection.prototype.getLocalStreams) {
        PeerConnection.prototype.getLocalStreams = function() {
          return this.localStreams;
        };
        PeerConnection.prototype.getRemoteStreams = function() {
          return this.remoteStreams;
        };
      }
    }
    out = {
      PeerConnection: PeerConnection,
      IceCandidate: IceCandidate,
      SessionDescription: SessionDescription,
      MediaStream: MediaStream,
      getUserMedia: getUserMedia,
      URL: URL,
      attachStream: attachStream,
      processSDPIn: processSDPIn,
      processSDPOut: processSDPOut,
      PeerConnConfig: PeerConnConfig,
      browser: browser,
      supported: supported,
      constraints: mediaConstraints
    };
    return out;
  };

  module.exports = shim();

}).call(this);

});
require.alias("component-emitter/index.js", "holla/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("holla/dist/holla.js", "holla/index.js");

if (typeof exports == "object") {
  module.exports = require("holla");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("holla"); });
} else {
  window["holla"] = require("holla");
}})();