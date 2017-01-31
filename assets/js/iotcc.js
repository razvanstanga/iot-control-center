
var iotCC = {
    mqttDefaultConfig: {
        keepalive: 10,
        protocolId: 'MQTT',
        protocolVersion: 4,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
        will: {
            topic: '/lwt',
            payload: 'Connection Closed abnormally..!',
            qos: 2,
            retain: true
        },
        rejectUnauthorized: false,
        secure: false,
        simulateDevices: false,
        debug: false,
    },
    mqttConfig: {},
    mqttClient: null,
    templates : [],
    setConfig: function(mqttConfig) {
        this.mqttConfig = Object.assign(this.mqttDefaultConfig, mqttConfig);
    },
    getConfig: function() {
        return this.mqttConfig;
    },
    init: function(mqttConfig) {
        if ((typeof(window['mqttConfig']) == 'undefined')) {
            console.log ('mqttConfig is not defined in config.js. see config.sample.js');
            return;
        } else if (typeof jQuery == 'undefined') {
            console.log ('IoT Control center requires jQuery');
            return;
        }
        this.setConfig(mqttConfig);

        this.mqttClient = mqtt.connect('ws' + (this.mqttConfig.secure==true?'s':'') + '://' + this.mqttConfig.host + ':' + this.mqttConfig.port, this.mqttConfig);

        this.mqttClient.on('error', function (err) {
            console.log(err);
            iotCC.mqttClient.end();
        });

        this.mqttClient.on('connect', function () {
            if (iotCC.mqttConfig.debug) console.log('client connected:' + iotCC.mqttConfig.clientId);
        });

        this.mqttClient.subscribe('/iotcc/+/+/config', {qos: 1});
        this.mqttClient.subscribe('/iotcc/+/+/data', {qos: 1});
        this.mqttClient.subscribe('/iotcc/+/device', {qos: 1});

        if (typeof(window['iotCCInitEvents']) != 'undefined') {
            for(var i in iotCCInitEvents) {
                try {
                    window[iotCCInitEvents[i]](this);
                } catch (err) {
                    console.log (iotCCInitEvents[i] + 'is not defined');
                    console.log (err);
                }
            }
        }

        if (this.mqttConfig.simulateDevices) {
            this.simulateDevices();
        }

        this.mqttClient.on('message', function (topic, message, packet) {
            try {
                var json = JSON.parse(message.toString());
            } catch(err){
                console.log ('There was a problem decoding the JSON message:\n\t' + message.toString());
                console.log (err);
                return;
            }
            var topicPath = topic.split('/'),
            widgetId = iotCC.formatTopic(topic),
            widget, html;

            if (iotCC.mqttConfig.debug) {
                console.log('Received Topic:= ' + topic + '\n\tMessage:= ' + message.toString());
            }

            if (topicPath[4] == 'config') {
                if (json.widget == 'toggle') {
                    if ($('input[name="' + widgetId + '"]').exists() == false) {
                        html = '<label class="switch switch--material">';
                        html += '<input type="checkbox" name="' + widgetId + '" data-widget="toggle" data-status="' + (json.checked==true?'1':'0') + '" class="switch__input switch--material__input" ' + (json.checked==true?'checked="checked"':'') + '>';
                        html += '<div class="switch__toggle switch--material__toggle">';
                        html += '<div class="switch__handle switch--material__handle">';
                        html += '</div>';
                        html += '</div>';
                        html += '</label>';
                        json.content = html;
                        json.widgetId = widgetId;
                        json.callback = function() {
                            if ($(this).prop('checked') == true) {
                                $(this).data('status', 1);
                                iotCC.mqttClient.publish(json.topic + '/data', '{"status":1}', {qos: 1, retained: false});
                            } else {
                                $(this).data('status', 0);
                                iotCC.mqttClient.publish(json.topic + '/data', '{"status":0}', {qos: 1, retained: false});
                            }
                        };
                        iotCC.addWidget(json);
                    }
                } else if (json.widget == 'radios') {
                    html = '';
                    $(json.options).each(function(k, v) {
                        html += '<label class="radio-button radio-button--material"><input type="radio" name="' + widgetId + '" data-widget="radios" data-status="' + v.status + '" class="radio-button__input radio-button--material__input" name="r" ' + (v.checked==true?'checked="checked"':'') + '><div class="radio-button__checkmark radio-button--material__checkmark"></div>'+ v.label +'</label>';
                    });
                    if ($('input[name="' + widgetId + '"]').exists() == false) {
                        json.content = html;
                        json.widgetId = widgetId;
                        json.callback = function() {
                            iotCC.mqttClient.publish(json.topic + '/data', '{"status":"' + $(this).data('status') + '"}', {qos: 1, retained: false});
                        };
                        iotCC.addWidget(json);
                    }
                }
            } else if (topicPath[4] == 'data') {
                widget = $('*[name="' + widgetId + '"]').first().data('widget');
                if (widget == 'toggle') {
                    if ($('input[name="' + widgetId + '"]').exists() == true) {
                        if (json.status == 1) {
                            $('input[name="' + widgetId + '"]').data('status', 1).prop('checked', true);
                        } else {
                            $('input[name="' + widgetId + '"]').data('status', 0).prop('checked', false);
                        }
                    }
                } else if (widget == 'radios') {
                    if ($('input[name="' + widgetId + '"]').filter('[data-status="' + json.status + '"]').exists() == true) {
                        $('input[name="' + widgetId + '"]').filter('[data-status="' + json.status + '"]').prop('checked', true);
                    }
                }
            } else if (topicPath[3] == 'device') {
                html = '';
                $(json.pages).each(function(k, page) {
                    if ($('div').filter('[data-page="' + page.pageId + '"]').exists() == false) {
                        html += '<div class="row" data-page="' + page.pageId + '"></div>';
                        iotCC.addTabPage(page);
                    }
                });
                $('section.content').filter('[data-section="dashboard"]').append(html);
            }
            if (typeof(window['iotCCMessageEvents']) != 'undefined') {
                for(var i in iotCCMessageEvents) {
                    try {
                        window[iotCCMessageEvents[i]](this, topic, topicPath, json);
                    } catch (err) {
                        console.log (iotCCMessageEvents[i] + 'is not defined');
                        console.log (err);
                    }
                }
            }
        });

        iotCC.mqttClient.on('close', function () {
            console.log(mqttConfig.clientId + ' disconnected');
        });
    },
    simulateDevices: function() {
        //this.client.subscribe('/iotcc/+/+/data', {qos: 1});
        this.mqttClient.publish('/iotcc/' + mqttConfig.clientId + '/device', '{"command":"getDevice","param":""}', {qos: 1, retained: false});
        this.mqttClient.publish('/iotcc/relays/device', '{"name":"2 relays","desc":"on a board", "pages" : [{"pageId" : 10, "pageName" : "Page 1"}, {"pageId" : 20, "pageName" : "Page 2"}]}', {qos: 1, retained: false});
        this.mqttClient.publish('/iotcc/relays/toggle1/config', '{"id":"1", "page": "Page 1", "pageId": 10, "widget":"toggle", "title":"Relay 1", "topic":"/iotcc/relays/toggle1", "checked":true, "template": "info-box", "icon": "ion-toggle-filled"}', {qos: 1, retained: false});
        this.mqttClient.publish('/iotcc/relays/toggle2/config', '{"id":"2", "page": "Page 2", "pageId": 10, "widget":"toggle", "title":"Relay 2", "topic":"/iotcc/relays/toggle2", "template": "info-box", "icon": "ion-toggle-filled"}', {qos: 1, retained: false});

        this.mqttClient.publish('/iotcc/relays1/device', '{"name":"2 relays","desc":"on a board", "pages" : [{"pageId" : 10, "pageName" : "Page 1"}, {"pageId" : 20, "pageName" : "Page 2"}]}', {qos: 1, retained: false});
        this.mqttClient.publish('/iotcc/relays1/toggle1/config', '{"id":"10", "page": "Page 1", "pageId": 20, "widget":"toggle", "title":"Relay 1", "topic":"/iotcc/relays1/toggle1", "template": "info-box", "icon": "ion-toggle-filled"}', {qos: 1, retained: false});
        this.mqttClient.publish('/iotcc/relays1/toggle2/config', '{"id":"11", "page": "Page 2", "pageId": 20, "widget":"toggle", "title":"Relay 2", "topic":"/iotcc/relays1/toggle2", "template": "info-box", "icon": "ion-toggle-filled"}', {qos: 1, retained: false});

        this.mqttClient.publish('/iotcc/heater1/heater/config', '{"id":"100", "page": "Page 1", "pageId": 20, "widget":"radios", "title":"Header 1", "topic":"/iotcc/heater1/heater", "options":[{"checked":true, "label": "Off", "status":"1"}, {"label": "Confort", "status":"2"}, {"label": "Anti freeze", "status":"3"}, {"label": "Confort -2", "status":"4"}], "template": "info-box", "icon": "ion-levels"}', {qos: 1, retained: false});
    },
    formatTopic: function(topic) {
        return topic.replace(/\//gi, '_').replace(/:/gi, '_').replace('_data', '').replace('_config', '');
    },
    addWidget: function(json) {
        if (this.templates[json.template] != undefined) {
            iotCC.addHtml(json, this.templates[json.template]);
        } else {
            $.get('template/' + json.template + '.html', function(html) {
                iotCC.templates[json.template] = html;
                iotCC.addHtml(json, html);
            });
        }
    },
    addHtml: function(json, html) {
        for (var key in json) {
            html = html.replace('{' + key + '}', json[key]);
        }
        html = html.replace(/{(\w*)}/g, '');
        var section = $('section.content').filter('[data-section="dashboard"]');
        var widgets = $(section).find('div[data-page="' + json.pageId + '"]').find('div.widgetcontainer').length;
        if (widgets > 0 && widgets%2 == 0) {
            $(section).find('div[data-page="' + json.pageId + '"]').append('<div class="clearfix visible-sm-block"></div>');
        }
        $(section).find('div[data-page="' + json.pageId + '"]').append('<div class="col-md-3 col-sm-6 col-xs-12 widgetcontainer">' + html + '</div>');
        if (json.callback != undefined) {
            $('input[name="' + json.widgetId + '"]').click(json.callback);
        }
    },
    addTabPage: function(page){
        if ($('div.pagination').find('label').filter('[data-pagination="' + page.pageId + '"]').exists() == false) {
            var html = '<label class="tab-bar__item tab-bar--material__item" data-pagination="' + page.pageId + '">';
            html += '<input type="radio" name="tab-bar-material-a">';
            html += '<button class="tab-bar__button tab-bar--material__button">';
            html += '<i class="tab-bar__icon tab-bar--material__icon ' + page.icon + '"></i>';
            html += '<div class="tab-bar__label tab-bar--material__label">' + page.pageName + '</div>';
            html += '</button>';
            html += '</label>';
            $('.pagination').append(html);
            $('label').filter('[data-pagination="' + page.pageId + '"]').click(function(e){
                var pageId = $(this).data('pagination');
                $('div.row').addClass('hide');
                $('div.row').filter('[data-page="' + pageId + '"]').removeClass('hide');
            });
        }
    }
}

jQuery.fn.exists = function(){return ($(this).length > 0);}
 $(document).ready(function(){
    iotCC.init(mqttConfig);

    $('.navigation').click(function(e){
        e.preventDefault();
        var section = $(this).data('section');
        $('.navigation').parent().removeClass('active');
        $(this).parent().addClass('active');
        $('section.content,section.content-header').addClass('hide');
        $('section.content,section.content-header').filter('[data-section="' + section + '"]').removeClass('hide');
    });
    $('label').filter('[data-pagination="0"]').click(function(e){
        $('div.row').removeClass('hide');
    });
});

// custom console
console = new Object();
console.log = function(log) {
    $('.console').prepend(log + '<br />');
};
console.debug = console.log;
console.info = console.log;
console.warn = console.log;
console.error = console.log;
