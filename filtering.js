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

let manifestContainer;

let collection = [
  {
    id: 1,
    name: "Simulations WHERE Owner=psylwester",
    href: "Simulations?filters=Owner=psylwester&orderby=DateCreated%20desc&count=1&offset=0",
    status: 1,
    count: 0,
    created: "2019-10-02T22:46:39.574Z"
  }, {
    id: 2,
    name: "Simulations WHERE Owner=psylwester AND DateCreated<=2019-10-01",
    href: "Simulations?filters=Owner=psylwester&orderby=DateCreated%20desc&count=1&offset=0",
    status: 1,
    count: 0,
    created: "2019-10-02T22:46:39.574Z"
  },  {
    id: 3,
    name: "Simulations WHERE Owner=psylwester AND Status=Succeeded",
    href: "Simulations?filters=Owner=psylwester&orderby=DateCreated%20desc&count=1&offset=0",
    status: 0,
    count: 0,
    created: "2019-10-02T22:46:39.574Z"
  },  {
    id: 4,
    name: "Simulations WHERE Owner=psylwester AND Status=Succeeded",
    href: "Simulations?filters=Owner=psylwester&orderby=DateCreated%20desc&count=1&offset=0",
    status: 0,
    count: 0,
    created: "2019-10-02T22:46:39.574Z"
  },  {
    id: 5,
    name: "Simulations WHERE Owner=psylwester AND Status=Succeeded",
    href: "Simulations?filters=Owner=psylwester&orderby=DateCreated%20desc&count=1&offset=0",
    status: 0,
    count: 0,
    created: "2019-10-02T22:46:39.574Z"
  }

];

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
  if (ele !== undefined && "parentNode" in ele) {
    ele.parentNode.removeChild(ele);
  }
};

/** MANIFEST */

/**
 * undoManifest removes a list of the collection from view.
 * @private
 */
const undoManifest = function() {
  // clearClassList(element, STATE.log);
  manifestContainer.removeEventListener("click", manifestClickHandler);
  setTimeout(function(){
    removeMarkup(manifestContainer);
    manifestContainer = undefined;
  },0);
};

/**
 * doManifest toggles a list of the history into view.
 *
 * @public by proxy.
 * @param {Object} addendum is a Model instance to prepend to a list in view.
 */
const doManifest = function(addendum) {
  let element, wrap, table, row;
  const buildRow = function(item) {
    let columns = ["name", "created", "menu", "status"];
    let when = new Date(item.created);
    let tr = document.createElement("TR");
    let a = document.createElement("A");
    let menu = document.createElement("I");
    let star = document.createElement("I");
    columns.forEach(function(column) {
      let td = document.createElement("TD");
      switch (column) {
        case "created":
          td.appendChild(document.createTextNode(when.toLocaleTimeString()));
          break;
        case "name":
          a.appendChild(document.createTextNode(item[column]));
          a.setAttribute("href", item.href);
          td.appendChild(a);
          break;
        case "menu":
          menu.classList.add("material-icons");
          menu.appendChild(document.createTextNode("more_vert"));
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
      menu.closest("TD").classList.add("interact");
    } else {
      star.closest("TD").classList.add("interact");
      star.setAttribute("title","remember this filtering");
    }
    return tr;
  };
  if (element === undefined) {
    // dispatchUI(dismissUI);
    element = document.body; // moduleElement();
  }
  if (manifestContainer === undefined) {
    wrap = document.createElement("DIV");
    table = document.createElement("TABLE");
    manifestContainer = document.createElement("ASIDE");
    if (collection.length > 0) {
      for (let i = 0; i < collection.length; i++) {
        let item = collection[i];
        row = buildRow(item);
        table.appendChild(row);
      }
      // table.querySelector("TD").innerHTML = "Current";
    } else {
      // row = buildRow(new Model({ message:"There have been no notifications yet!" }));
      row = buildRow({ name: "There have been no filterings yet!" });
      table.appendChild(row);
    }
    table.classList.add("mono");
    wrap.appendChild(table);
    manifestContainer.appendChild(wrap);
    manifestContainer.setAttribute("id", "filtering");
    manifestContainer.addEventListener("click", manifestClickHandler);
    element.appendChild(manifestContainer);
    setTimeout(function(){
      // element.classList.add("active");
    },0);
  } else {
    undoManifest();
  }
};

const doContextMenu = function (row) {
  
   let menu = document.createElement("MENU");
   let list = document.createElement("UL");
   ["Edit Name", "Move to Top", "Remove"].forEach(option => {
     let item = document.createElement("LI");
     item.appendChild(document.createTextNode(option));
     list.appendChild(item);
   });
   menu.appendChild(list);
   row.querySelector("TD.menu").appendChild(menu);
   
   menu.addEventListener("click", contextMenuHandler);
   menu.addEventListener("mouseleave", contextMenuHandler);
};


/** TRANSACTION */

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

/** INTERACTION */

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

const manifestClickHandler = function (event) {
  if (event.target.closest("TD.interact")) {
    event.stopPropagation();
    event.preventDefault();
    if (event.target.closest("TD.menu")) {
      doContextMenu(event.target.closest("TR"));
    } else {
      // toggleFavorite();
    }
  } else {
    undoManifest();
  }
};

const contextMenuHandler = function (event) {
  event.stopPropagation();
  let menu = event.target.closest("MENU"); 
  menu.removeEventListener("click", contextMenuHandler);
  menu.removeEventListener("mouseleave", contextMenuHandler);
  removeMarkup(menu);
};

/** RENDER */

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
      button.addEventListener("click", manifestToggleHandler);
      button.setAttribute("title", "show filtering history");
      pagingLocation.appendChild(button);
    }

  });
};


export default { render };