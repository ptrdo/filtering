import Config from "config";
import Auth from "comps-ui-auth";
import Postette from "../node_modules/postette/postette.js";
import templater from "microdata-template";
import Filtering from "../../filtering.js";

class Index {

  constructor() {
    console.log("The Index module has been constructed!");
    Postette.init({
      echo: true,
      prefix: false
    });
    if (!("postette" in window)) {
      window["postette"] = Postette;
    }
  };

  render(rootElement=document) {
    
    let authMenu = document.querySelector("a.nav-account");
    authMenu.addEventListener("click", function (event) {
      let menu = event.target;
      while (!/^(LI|MENU)$/i.test(menu.nodeName)) {
        menu = menu.parentElement;
      }
      menu.classList.toggle("active"); 
    });
    
    let authToggle = document.querySelector("a[data-action=session]");
    authToggle.addEventListener("click", function (event) {
      let menu = event.target;
      while (!menu.classList.contains("active")) {
        menu = menu.parentElement;
      }
      menu.classList.remove("active");
      Auth.signout(Config.appName);
    });

    setTimeout(function () {
      Postette.alert("Ready!");
      document.documentElement.setAttribute("data-useragent", navigator.userAgent);
      window.addEventListener("touchstart", function onFirstTouch() {
        document.body.classList.add("touch");
        window.removeEventListener('touchstart', onFirstTouch, false);
      }, false);
    }, 0);

  };

  load() {};
  unload() {};
}

export default Index;