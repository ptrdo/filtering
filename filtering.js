import _ from "lodash";

/**
 * Filtering
 * Filter History Capture and Management
 *
 * @author psylwester(at)idmod(dot)org
 * @version 2.7.0, 2019/09/30
 * @requires ES6, lodash
 *
 */

const moduleElement = () => document.getElementById("explore");

let manifestContainer, messageContainer;

let collection = [
  {
    id: 1,
    name: "My most favorite",
    href: "Simulations?filters=Owner=psylwester&orderby=DateCreated%20desc&count=1&offset=0",
    status: 1,
    count: 0,
    created: "2019-10-02T22:46:39.574Z"
  }, {
    id: 2,
    name: "My second-most favorite",
    href: "Simulations?filters=Owner=psylwester&orderby=DateCreated%20desc&count=1&offset=0",
    status: 1,
    count: 0,
    created: "2019-10-02T22:46:39.574Z"
  },  {
    id: 3,
    name: "My third-most favorite",
    href: "Simulations?filters=Owner=psylwester&orderby=DateCreated%20desc&count=1&offset=0",
    status: 3,
    count: 0,
    created: "2019-10-02T22:46:39.574Z"
  }

];

/* UTILITY */

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
  if (ele !== undefined && "parentNode" in ele) {
    ele.parentNode.removeChild(ele);
  }
};

/* MANIFEST */

/**
 * undoManifest removes a list of the collection from view.
 * @private
 */
var undoManifest = function() {
  // clearClassList(element, STATE.log);
  setTimeout(function(){
    removeMarkup(manifestContainer);
    manifestContainer = undefined;
  },400);
};

/**
 * doManifest toggles a list of the history into view.
 *
 * @public by proxy.
 * @param {Object} addendum is a Model instance to prepend to a list in view.
 */
const doManifest = function(addendum) {
  let log, wrap, table, row;
  const buildRow = function(item) {
    let columns = ["id","name", "href", "status"];
    let d = new Date(item.created);
    let tr = document.createElement("TR");
    columns.forEach(function(column) {
      let td = document.createElement("TD");
      switch (column) {
        case "created":
          td.appendChild(document.createTextNode(d.toLocaleTimeString()));
          break;
        case "level":
          td.appendChild(document.createTextNode(item[column]));
          td.classList.add(item[column]);
          break;
        case "href":
          td.appendChild(document.createTextNode(item[column]));
          td.classList.add(column);
          break;
        default:
          td.appendChild(document.createTextNode(item[column]));
      }
      tr.appendChild(td);
    });
    return tr;
  };
  if (element === undefined) {
    // dispatchUI(dismissUI);
  }
  if (manifestContainer === undefined) {
    wrap = document.createElement("DIV");
    table = document.createElement("TABLE");
    manifestContainer = document.createElement("ASIDE");
    if (collection.length > 0) {
      for (let i = collection.length - 1; i > -1; i--) {
        let item = collection[i];
        row = buildRow(item);
        table.appendChild(row);
      }
      table.querySelector("TD").innerHTML = "Latest";
    } else {
      row = buildRow(new Model({ message:"There have been no notifications yet!" }));
      table.appendChild(row);
    }
    wrap.appendChild(table);
    manifestContainer.appendChild(wrap);
    if (messageContainer === undefined) {
      element.appendChild(manifestContainer);
    } else {
      element.insertBefore(manifestContainer, messageContainer);
    }
    setTimeout(function(){
      element.classList.add(STATE.log);
    },0);
  } else if (!!addendum) {
    if (manifestContainer !== undefined) {
      log = manifestContainer.querySelector("TABLE");
      row = buildRow(addendum);
      log.insertBefore(row, log.querySelector("TR"));
    }
  } else {
    undoManifest();
  }
};


/* TRANSACTION */

/**
 * fetchHistory is call to get Filter History.
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

/* INTERACTION */

const filterToggleHandler = function (event) {
  event.stopPropagation();
  event.preventDefault();
  moduleElement().classList.toggle("filtering-favorite");

  if (moduleElement().classList.contains("filtering-favorite")) {
    log("success", "This filtering has been remembered.")
  } else {
    log("alert", "This filtering has been forgotten.")
  }

};

const manifestToggleHandler = function (event) {
  event.stopPropagation();
  event.preventDefault();

  doManifest();
};

const render = function () {

  let filterLocation = document.querySelector(".query .clause .ultimate");
  let pagingLocation = document.querySelector(".query .clause .anchor .pagerBox .pageControl");

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
      button.setAttribute("title", "remember this");
      filterLocation.appendChild(button);
    } else {
      button.setAttribute("title", "show filtering history");
      pagingLocation.appendChild(button);
    }

  });
};


export default { render };