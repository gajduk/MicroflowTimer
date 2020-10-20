define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dojo/_base/lang"
], function(declare, _WidgetBase, lang) {
    "use strict";

    return declare("DynamicPageTitle.widget.DynamicPageTitle", [_WidgetBase], {

        // Parameters configured in the Modeler.
        callEvent: "", // "callMicroflow" | "callNanoflow"
        microflow: "",
        nanoflow: null,

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handles: null,
        _contextObj: null,
        
        postCreate: function() {
            this._handles = [];

            if(!(this.microflow && this.callEvent == "callMicroflow" || this.nanoflow.nanoflow && this.callEvent == "callNanoflow")) {
                mx.ui.error("No action specified for " + this.callEvent)
            }
        },

        update: function (obj, callback) {
            logger.debug(this.id + ".update");

            this._contextObj = obj;
            this._resetSubscriptions();

            this._fetchAndUpdateTitle();

            this._executeCallback(callback, "update");
        },

        resize: function(box) {},

        uninitialize: function() {

        },

        _fetchAndUpdateTitle: function() {
            logger.debug(this.id + "._runTimer", this.interval);
            if (this.callEvent == "" || ! this._contextObj) 
                return;
            if(this.callEvent === "callMicroflow" && this.microflow) {
                this._execMf()
            } else if (this.callEvent === "callNanoflow" && this.nanoflow.nanoflow){
                this._executeNanoFlow()
            } else {
                return;
            }
        },

        _execMf: function() {
            logger.debug(this.id + "._execMf");
            if (!this._contextObj) {
                return;
            }

            if ( ! this.microflow) {
                return;
            }
            var mfObject = {
                params: {
                    actionname: this.microflow,
                    applyto: "selection",
                    guids: [this._contextObj.getGuid()]
                },
                callback: lang.hitch(this, function(result) {
                    logger.debug(this.id + "._execMf callback, setting title to "+result);
                    this._setTitle(result);
                }),
                error: lang.hitch(this, function(error) {
                    logger.error(this.id + ": An error ocurred while executing microflow: ", error);
                })
            };

            if (!mx.version || mx.version && parseInt(mx.version.split(".")[0]) < 6) {
                mfObject.store = {
                    caller: this.mxform
                };
            } else {
                mfObject.origin = this.mxform;
            }

            mx.data.action(mfObject, this);
        },

        _executeNanoFlow: function() {
            if ( ! this.nanoflow.nanoflow || ! this.mxcontext) 
                return;
            
            mx.data.callNanoflow({
                nanoflow: this.nanoflow,
                origin: this.mxform,
                context: this.mxcontext,
                callback: lang.hitch(this, function(result) {
                    logger.debug(this.id + "._executeNanoFlow callback, setting title to "+result);
                    this._setTitle(result);
                }),
                error: lang.hitch(this, function(error) {
                    logger.error(this.id + ": An error ocurred while executing nanoflow: ", error);
                })
            });
        },

        // Reset subscriptions.
        _resetSubscriptions: function() {
            this.unsubscribeAll();

            // When a mendix object exists create subscribtions.
            if ( this._contextObj ) {
                this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: lang.hitch(this, function(guid) {
                        this._fetchAndUpdateTitle();
                    })
                });
            }
        },

        _executeCallback: function (cb, from) {
            logger.debug(this.id + "._executeCallback" + (from ? " from " + from : ""));
            if (cb && typeof cb === "function") {
                cb();
            }
        }
    });
});

require(["DynamicPageTitle/widget/DynamicPageTitle"])
