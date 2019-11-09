import _ from "lodash";

/**
 * Filtering
 * Filter History Capture and Management
 *
 * @author psylwester(at)idmod(dot)org
 * @version 2.7.0, 2019/10/08
 * @requires ES6, lodash
 *
 */

const moduleElement = () => document.getElementById("explore");
const queryElement = () => document.querySelector("section#explore div.query");
const observerIdentity = "explore.filtering";
const preferences = () => comps.storage.preferences;
const root = "/#explore/";
const rootPattern = /\/?#explore\/?/;

let doublechecked = false;
let currentHash = "";
let manifestContainer;

/**
 * collection receives, transforms, and supplies data for display.
 * packed: {0:"foo|U2ltdWxhdGlvbnM/ZmlsdGVyaW5n|2019-10-02T22:46:39.574Z"};
 * unpacked: [{name:"foo",href:"Simulations?filtering",created:dateObject,status:1}];
 *
 * @private
 * @property {Object} input (unused) is internal cache of Request Response.
 * @property {Array} output is the coalesced and transformed data for display.
 */
const collection = {

  input: {},
  output: [],

  pack: function (source) {
    let data = {};
    source.forEach((item,i) => {
      data[i] = [btoa(item.name),btoa(item.hash),item.created.toISOString()].join("|");
    });
    return data;
  },

  unpack: function (source) {
    let data = [];
    Object.keys(source).sort((a,b) => a-b).forEach(key => {
      let item = source[key].split("|");
      data.push({
        name: atob(item[0]),
        hash: atob(item[1]),
        params: this.deparam(atob(item[1])),
        created: new Date(Date.parse(item[2])),
        visited: null,
        status: 1
      });
    });
    return data;
  },

  /**
   * resort orders status:1 (favs) atop and unpreturbed, but status:0 (history) follows as most-recent first.
   */
  resort: function () {
    this.output.sort((a,b) => b.status - a.status);
    this.output.sort((a,b) => !b.status && !a.status ? a.created < b.created ? 1 : -1 : 0);
  },

  /**
   * deparam objectifies a parameter string.
   * @param {String} str
   * @returns {Object} all found parameters.
   */
  deparam: function (str) {
    var obj = {};
    var reg = /\\?([^?=&]+)(=([^&#]*))?/g;
    var source = unescape(str||"");
    source.replace(reg, function ($0, $1, $2, $3) {
      if (typeof $3 == "string") {
        obj[$1] = decodeURIComponent($3.replace(/%25/g, "").replace(/%/g, ""));
      }
    });
    obj.entity = str.split("?")[0].replace(rootPattern, "");
    ["filters","tagFilters"].forEach(key => {
      if (key in obj) {
        obj[key] = obj[key].split(",").sort((a,b) => b.localeCompare(a)).join(",");
      }
    })
    return obj;
  },

  /**
   * rehash stringifies an object of parameters.
   * @param {Object} obj
   * @returns {String} a sanctioned sequence of parameters.
   */
  rehash: function (obj) {
    let hash = root + obj.entity;
    let params = Object.keys(obj).sort((a,b) => {
      let order =
        a == "filters" ? -1 : b == "filters" ? 1 :
          a == "tagFilters" ? -1 : b == "tagFilters" ? 1 :
            b.localeCompare(a);
      return order;
    });
    params.forEach((param,i) => {
      if (/^filters|tagFilters|orderby|offset|count$/.test(param)) {
        hash = hash + (!!i?"&":"?") + param + "=" + obj[param].replace(/\+(?!asc\b|desc\b)/g, "%2B").replace(/\s/g, "+");
      }
    });
    return hash;
  },

  findByHash: function (hash) {
    return _.find(this.output, { hash: hash });
  },

  findFavoriteByLocationHash: function () {
    let params = this.deparam(window.location.hash);
    let hash = this.rehash(params);
    let found = this.findByHash(hash);
    return !!_.get(found, "status", false);
  },

  /**
   * addItem considers items for either long- or short-term memory.
   * @param {String} href is a window.location.hash to consider.
   * @param {Boolean} favorite (optional) true when favorite (status:1) is requested.
   * @param {Boolean} current (optional) true when this is also the current page.
   * @returns {Boolean} true when the item was or is now a favorite.
   */
  addItem: function (href, favorite, current) {
    let hash, name, prev, params = this.deparam(href);
    if ("filters" in params || "tagFilters" in params) {
      hash = this.rehash(params);
      prev = this.findByHash(hash);
      if (!!current) {
        currentHash = hash;
        if (!!prev) { prev.visited = (new Date()); }
      }
      if (!!prev) {
        if (!!favorite) {
          if (!!prev.status) {
            // a duplicate among favorites
            log("warning", "That filtering is already being remembered.");
          } else {
            // a history item becoming a favorite
            prev.status = 1;
            prev.created = (new Date());
            this.update();
          }
          return true;
        } else {
          // a duplicate among history
          prev.created = (new Date());
          this.resort();
          return !!prev.status;
        }
      } else {
        // all new, history or favorite
        name = this.autoName(params);
        this.output.push({
          name: name,
          hash: hash,
          params: params,
          created: (new Date()),
          visited: !!current ? (new Date()) : null,
          status: !!favorite ? 1 : 0
        });
        if (!!favorite) {
          this.update();
          return true;
        } else {
          this.resort();
          return false;
        }
      }
    } else {
      if (!!favorite) {
        log("warning", "There are no filters to remember.");
      }
      currentHash = "";
      return false;
    }
  },

  removeItem: function (hash) {
    let found = this.findByHash(hash);
    if (!!found) {
      found.status = 0;
      found.created = (new Date());
      this.update();
    }
  },

  promoteItem: function (hash) {
    let found = this.findByHash(hash);
    if (!!found) {
      this.output.forEach(function(item,i,output){
        if(item.hash === hash){
          output.splice(i, 1);
          output.unshift(item);
        }
      });
      this.update();
    }
  },

  renameItem: function (hash, name, callback) {
    let found = this.findByHash(hash);
    if (!!found) {
      found.name = name;
      if (!_.get(found,"status")) {
        found.status = 0;
        found.created = (new Date());
      }
      this.update();
      if (!!callback && callback instanceof Function) {
        callback();
      }
    } else {
      let params = this.deparam(hash);
      let newHash = this.rehash(params);
      this.addItem(newHash, true);
      this.renameItem(newHash, name, callback);
    }
  },

  autoName: function (params) {
    let name = params.entity + " WHERE ";
    if ("filters" in params) {
      name += params.filters.split(",").join(" AND ");
    }
    if ("tagFilters" in params) {
      if ("filters" in params) {
        name += " AND TAG ";
      } else {
        name += "TAG " ;
      }
      name += params.tagFilters.split(",").join(" AND TAG ");
    }
    name = name.replace(/\.\d+Z\b/g,""); // trims zulu time
    return name;
  },

  /**
   * update is the primary sync TO preference data.
   */
  update: function () {
    this.resort();
    console.log(observerIdentity, "updating", this.output);
    preferences().set(observerIdentity, this.pack(_.filter(this.output, { status: 1 })));
    queryElement().classList.toggle("filtering-favorite", this.findFavoriteByLocationHash());
    /* TODO: Defer view operations to listeners. */
  },

  /**
   * refresh is the primary sync FROM preference data.
   * @note Retries once in cases when load may be protracted.
   * @param {Function} callback is passed the current collection.
   */
  refresh: function (callback) {
    const self = this;
    preferences().getAsync(observerIdentity, function(err, value) {
      if ((!!err || !value || _.isEmpty(value)) && !doublechecked) {
        doublechecked = true;
        setTimeout(function() {
          self.refresh(callback);
        },1000);
      } else {
        self.output = self.unpack(value||{});
        if (!!callback && callback instanceof Function) {
          callback(self.output);
        }
      }
    }, {}); // {} is default value
  },

  /**
   * reset transitions this collection from one user to another.
   */
  reset: function () {
    doublechecked = false;
    this.output = [];
  },

  get count () {
    return this.output.length;
  },

  get countFavorites () {
    return _.filter(this.output, { status: 1 }).length;
  },

  get countHistory () {
    return _.filter(this.output, { status: 0 }).length;
  },

  /**
   * latest provides the currently assembled data of history.
   * @returns {Collection} the Object of Arrays of Objects.
   */
  get latest () {
    return this.output;
  }
};

/** UTILITY */

const log = function(degree, message) {

  let level;
  let means = _.get(window, "comps.notifier", _.get(window, "postette"), undefined);

  if (!!means) {
    level = /warn/i.test(degree) ? "warning"
      : /error/i.test(degree) ? "error"
        : /success/i.test(degree) ? "success"
          : "alert";
  } else {
    means = console;
    level = /warn/i.test(degree) ? "warn"
      : /error/i.test(degree) ? "error"
        : "log";
  }

  means[level](message);
};

/**
 * removeMarkup safely removes markup.
 *
 * @private
 * @param {DOMElement} ele is the target element.
 */
const removeMarkup = function (ele) {
  try {
    if (ele !== undefined && "parentNode" in ele) {
      ele.parentNode.removeChild(ele);
    }
  } catch (err) {}
};

/** MANIFEST */

/**
 * redoManifest updates a manifest in display.
 * @todo: update live.
 */
const redoManifest = function() {
  undoManifest(doManifest);
};

/**
 * undoManifest removes a list of the collection from view.
 * @private
 */
const undoManifest = function(callback) {
  manifestContainer.removeEventListener("click", manifestClickHandler);
  removeMarkup(manifestContainer);
  manifestContainer = undefined;
  if (!!callback && callback instanceof Function) {
    callback();
  }
};

/**
 * doManifest toggles a list of the history into view.
 * @todo live update.
 * @public by proxy.
 * @param {Object} addendum is a Model instance to prepend to a list in view.
 */
const doManifest = function(addendum) {
  let element, wrap, table, row, ref;
  const buildRow = function(item) {
    let columns = ["name", "visited", "menu", "status"];
    let when = _.isDate(_.get(item,"visited")) ? item.visited.toLocaleTimeString().replace(/\:\d\d\s/," ") : "";
    let tr = document.createElement("TR");
    let a = document.createElement("A");
    let menu = document.createElement("I");
    let star = document.createElement("I");
    columns.forEach(function(column) {
      let td = document.createElement("TD");
      switch (column) {
        case "visited":
          if (item.hash == currentHash) {
            td.appendChild(document.createTextNode("current"));
          } else {
            td.appendChild(document.createTextNode(when));
          }
          break;
        case "name":
          if (!!_.get(item, "hash")) {
            a.appendChild(document.createTextNode(item[column]));
            a.setAttribute("href", item.hash);
            td.appendChild(a);
          } else {
            td.classList.add("nullify");
            td.appendChild(document.createTextNode(item[column]));
          }
          break;
        case "menu":
          if (!!_.get(item, "hash")) {
            menu.classList.add("material-icons");
            menu.appendChild(document.createTextNode("more_vert"));
          }
          td.appendChild(menu);
          break;
        case "status":
          star.classList.add("material-icons");
          star.appendChild(document.createTextNode("star"));
          td.appendChild(star);
          break;
        default:
          td.appendChild(document.createTextNode(item[column]));
      }
      td.classList.add(column);
      tr.appendChild(td);
    });
    if (!!item.status) {
      tr.classList.add("filtering");
      menu.closest("TD").classList.toggle("interact", !!_.get(item, "hash"));
    } else {
      star.closest("TD").classList.toggle("interact", !!_.get(item, "hash"));
      star.setAttribute("title","remember this filtering");
    }
    return tr;
  };
  if (element === undefined) {
    element = document.body; // moduleElement();
  }
  if (manifestContainer === undefined) {
    wrap = document.createElement("DIV");
    table = document.createElement("TABLE");
    manifestContainer = document.createElement("ASIDE");
    if (collection.countFavorites < 1) {
      row = buildRow({ name: "Remembered filterings will appear here.", status: 1 });
      table.appendChild(row);
    }
    for (let i = 0; i < collection.count; i++) {
      let item = collection.latest[i];
      row = buildRow(item);

      table.appendChild(row);
    }
    if (collection.countHistory < 2) {
      row = buildRow({ name: "Recent filterings will appear here...", status: 0 });
      ref = table.querySelector("TR:not(.filtering)");
      if (!!ref) {
        ref.parentNode.insertBefore(row, ref);
      } else {
        table.appendChild(row);
      }
    }
    table.classList.add("mono");
    wrap.appendChild(table);
    manifestContainer.appendChild(wrap);
    manifestContainer.setAttribute("id", "filtering");
    manifestContainer.addEventListener("click", manifestClickHandler);
    element.appendChild(manifestContainer);
  } else {
    undoManifest();
  }
};

const doContextMenu = function (row) {

  let aside = document.getElementById("filtering");
  let container = aside.querySelector("div");
  let rectangle = container.getBoundingClientRect();
  let menu = document.createElement("MENU");
  let list = document.createElement("UL");

  ["Edit Name", "Move to Top", "Forget"].forEach(option => {
    let item = document.createElement("LI");
    item.classList.add(option.split(/\s/)[0]);
    item.appendChild(document.createTextNode(option));
    list.appendChild(item);
  });
  menu.appendChild(list);
  menu.addEventListener("click", contextMenuHandler);
  menu.addEventListener("mouseleave", contextMenuHandler);
  menu.style.top = (rectangle.top + row.offsetTop) + "px";
  aside.appendChild(menu);
  row.classList.add("active");
};

/** DIALOG */

const createDialog = function (hash, creating) {

  const onShow = function ($dialog) {

    let ele = $dialog.get(0);
    let item = collection.findByHash(hash);
    let input = ele.querySelector("input[name=name]");
    let submit = ele.querySelector("button.default");
    let handler = function(event) {
      if (event.keyCode == 13) {
        submit.click();
        input.removeEventListener("keyup", handler);
      }
    };

    if (!!item && "name" in item) {
      input.value = item.name;
    } else {
      let params = collection.deparam(hash);
      input.value = collection.autoName(params);
    }
    input.setAttribute("data-reserve", input.value);
    setTimeout(function(){
      input.focus();
      input.select();
      input.addEventListener("keyup", handler);
    }, 0);
  };

  const onConfirm = function (value, $dialog) {

    let ele = $dialog.get(0);
    let input = ele.querySelector("input[name=name]");
    let name = input.value.replace(/\x22/g,"'");

    if (value == "ok") {
      if (name.length < 1) {
        name = input.getAttribute("data-reserve");
        log("warning", "The filtering has been saved with an auto-generated name.");
      }
      collection.renameItem(hash, name,function() {
        if (document.getElementById("filtering")) {
          redoManifest();
        } else {
          log("success", "The current filtering has been remembered.");
        }
      });
    }
  };

  let message = "<fieldset class='filtering-confirm'>";
  message+= "<label>This is the filtering:</label>";
  message+= "<textarea name='hash' readonly spellcheck='false' rows='3'>" + hash + "</textarea>";
  message+= "<label>This is the name:<span>Double-quotes are not allowed.</span></label>";
  message+= "<input type='text' name='name' pattern='[^\x22]*' value='' spellcheck='false'/>";
  message+= "</fieldset>";

  window.comps.modules.dialog.make({
    type: "confirm",
    title: !!creating ? "Save this Filtering" : "Name this Filtering",
    message: message,
    cancelValue: "cancel",
    beforeShow: onShow,
    buttons: [
      { caption: "Cancel", value: "cancel" },
      { caption: "Save this Filtering", value: "ok", default: true }
    ],
    callback: onConfirm
  });
};

/** TRANSACTION */

/**
 * fetchHistory is call to get Filter History directly (unused).
 * @param successCallback
 * @param failureCallback
 */
const fetchHistory = function (successCallback, failureCallback)  {

  let url = "";

  getSecure(url)
    .then(data => {
      if (successCallback && successCallback instanceof Function) {
        successCallback();
      }
    })
    .catch(function (error) {
      if (failureCallback && failureCallback instanceof Function) {
        failureCallback(error);
      } else {
        console.error("filtering.fetchHistory", error);
      }
    })
    .finally(function () {

    });
};

/**
 * getSecure is a convenience stub to standardize REST header and Response parse.
 * @param {String} url
 * @return {Promise}
 */
const getSecure = function(url) {
  return fetch(url, {
    method: "GET",
    cache: "no-cache",
    headers: {
      "X-COMPS-Token": config.token
    }
  }).then(response => response.json());
};

/** INTERACTION */

const filterToggleHandler = function (event) {
  event.stopPropagation();
  event.preventDefault();
  if (!queryElement().classList.contains("filtering-favorite")) {
    if (/filters\=/i.test(window.location.hash)) {
      createDialog(window.location.hash, true);
    } else {
      log("warning", "There are no filters to remember.");
    }
  } else {
    doManifest();
  }
};

const manifestToggleHandler = function (event) {
  event.stopPropagation();
  event.preventDefault();
  doManifest();
};

const manifestClickHandler = function (event) {
  let target = event.target;
  let cell = event.target.closest("TD");
  if (!!cell) {
    event.stopPropagation();
    if (cell.classList.contains("interact")) {
      event.preventDefault();
      if (cell.classList.contains("menu")) {
        doContextMenu(target.closest("TR"));
      } else if (cell.classList.contains("status")) {
        let anchor = cell.closest("TR").querySelector("A");
        let hash = !!anchor ? anchor.getAttribute("HREF") : null;
        if (!!hash) {
          collection.addItem(hash, true);
          redoManifest();
        }
      }
      return false;
    } else if (!!target.closest("A")) {
      undoManifest();
      return true;
    } else if (cell.classList.contains("name") && !!cell.querySelector("A[HREF]")) {
      window.location = cell.querySelector("A[HREF]").getAttribute("HREF");
      undoManifest();
      return true;
    } else {
      return false;
    }
  } else {
    undoManifest();
    return false;
  }
};

const contextMenuHandler = function (event) {
  event.stopPropagation();
  let target = event.target;
  let menu = event.target.closest("MENU");
  let row = document.querySelector("#filtering TR.active");
  if (/click/i.test(event.type)) {
    let action = target.closest("LI").classList.value;
    let hash = row.querySelector("A").getAttribute("HREF");
    switch (action) {
      case "Edit":
        createDialog(hash, false);
        break;
      case "Move":
        collection.promoteItem(hash);
        redoManifest();
        break;
      case "Forget":
        collection.removeItem(hash);
        redoManifest();
        break;
    }
  }
  menu.removeEventListener("click", contextMenuHandler);
  menu.removeEventListener("mouseleave", contextMenuHandler);
  removeMarkup(menu);
  if (!!row) { row.classList.remove("active"); }
};

/** RENDER */

/**
 * render essentially initializes this library and installs UI into module view.
 */
const render = function () {

  let filterLocation = document.querySelector(".query .clause .ultimate");
  let pagingLocation = document.querySelector(".query .clause .anchor");

  ["filtering-toggle", "filtering-manifest"].forEach(function (name, i) {

    let icon = document.createElement("I");
    let button = document.createElement("BUTTON");
    icon.appendChild(document.createTextNode("star"));
    icon.classList.add("material-icons");
    button.classList.add(name);
    button.appendChild(icon);
    if (/toggle$/.test(name)) {
      button.addEventListener("click", filterToggleHandler);
      button.classList.add("fadein");
      button.setAttribute("title", "favorite this filtering");
      filterLocation.appendChild(button);
    } else {
      button.addEventListener("click", manifestToggleHandler);
      button.setAttribute("title", "show filtering history");
      pagingLocation.appendChild(button);
    }
  });

  /** START */

  collection.refresh(function(output) {

    setTimeout(function(){
      let isFavorite = collection.addItem(window.location.hash, null, true);
      queryElement().classList.toggle("filtering-favorite", isFavorite);
    },0);

    window.comps.pubsub.subscribe(
      "explore.grid.render",
      observerIdentity,
      function(responseHash) {
        let isFavorite = collection.addItem(responseHash, null, true);
        queryElement().classList.toggle("filtering-favorite", isFavorite);
      }
    );

    window.comps.pubsub.subscribe(
      "signin",
      observerIdentity,
      function () {
        collection.reset();
        collection.refresh(function() {
          let isFavorite = collection.addItem(window.location.hash, null, true);
          queryElement().classList.toggle("filtering-favorite", isFavorite);
        });
      }
    );
  });
};

const latest = function () {
  return collection.latest;
}

export default { render,latest };