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

const Filtering = function(props) {

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

  return {
    render: function() {

    }
  }
};

export default Filtering;