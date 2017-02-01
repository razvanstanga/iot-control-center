
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
    init: function(mqttConfig) {
        if (typeof jQuery == 'undefined') {
            this.showNotification('jQuery', 'IoT Control Center requires jQuery', 'dashboard', 'danger');
            logger.log ('IoT Control center requires jQuery');
            return;
        }
        var config = this.getConfig();
        if (typeof config == 'undefined') {
            this.showNotification('MQTT connection data', 'Please set the MQTT connection data in Settings', 'dashboard', 'danger');
            logger.log ('MQTT conection data is not set');
            return;
        }
        // TODO: check for localStorage object
        this.mqttConfig = Object.assign(this.mqttDefaultConfig, config);

        this.showNotification('Connecting to MQTT server', 'Trying to connect to ' + this.mqttConfig.host + ':' + this.mqttConfig.port, 'dashboard', 'info');

        this.mqttClient = mqtt.connect('ws' + (this.mqttConfig.secure==true?'s':'') + '://' + this.mqttConfig.host + ':' + this.mqttConfig.port, this.mqttConfig);

        this.mqttClient.on('error', function (err) {
            logger.log('Error' + err);
            iotCC.mqttClient.end();
        });

        this.mqttClient.on('connect', function () {
            if (iotCC.mqttConfig.debug) logger.log('client connected:' + iotCC.mqttConfig.clientId);
            iotCC.showNotification('Connected to MQTT server' + iotCC.mqttConfig.host + ':' + iotCC.mqttConfig.port, 'Waiting to receive data from devices.', 'dashboard', 'info');
        });

        this.mqttClient.subscribe('/iotcc/+/+/config', {qos: 1});
        this.mqttClient.subscribe('/iotcc/+/+/data', {qos: 1});
        this.mqttClient.subscribe('/iotcc/+/device', {qos: 1});

        if (typeof(window['iotCCInitEvents']) != 'undefined') {
            for(var i in iotCCInitEvents) {
                try {
                    window[iotCCInitEvents[i]](this);
                } catch (err) {
                    logger.log (iotCCInitEvents[i] + 'is not defined');
                    logger.log (err);
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
                logger.log ('There was a problem decoding the JSON message:\n\t' + message.toString());
                logger.log (err);
                return;
            }
            var topicPath = topic.split('/'),
            widgetId = iotCC.formatTopic(topic),
            widget, html;
            $('.notification-dashboard').addClass('hide');
            if (iotCC.mqttConfig.debug) {
                logger.log('Received Topic:= ' + topic + '\n\tMessage:= ' + message.toString());
            }

            if (topicPath[4] == 'config') {
                var page = {'pageId': json.pageId, 'pageName': json.pageName, 'icon': json.icon};
                iotCC.addPage(page);
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
                $(json.pages).each(function(k, page) {
                    iotCC.addPage(page);
                });
            }
            if (typeof(window['iotCCMessageEvents']) != 'undefined') {
                for(var i in iotCCMessageEvents) {
                    try {
                        window[iotCCMessageEvents[i]](this, topic, topicPath, json);
                    } catch (err) {
                        logger.log (iotCCMessageEvents[i] + 'is not defined');
                        logger.log (err);
                    }
                }
            }
        });

        this.mqttClient.on('close', function () {
            logger.log(iotCC.mqttConfig.clientId + ' disconnected');
        });
    },
    formatTopic: function(topic) {
        return topic.replace(/\//gi, '_').replace(/:/gi, '_').replace('_data', '').replace('_config', '');
    },
    addWidget: function(json) {
        if (this.templates[json.template] != undefined) {
            iotCC.addHtml(json, this.templates[json.template]);
        } else {
            // TODO : fetch custom templates over HTTP
            $.get('assets/template/' + json.template + '.html', function(html) {
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
        // TODO: add after sort ?
        /*var widgets = $(section).find('div[data-page="' + json.pageId + '"]').find('div.widgetcontainer').length;
        if (widgets > 0 && widgets%2 == 0) {
            $(section).find('div[data-page="' + json.pageId + '"]').append('<div class="clearfix visible-sm-block"></div>');
        }*/
        $(section).find('div[data-page="' + json.pageId + '"]').append(html);
        if (json.callback != undefined) {
            $('input[name="' + json.widgetId + '"]').click(json.callback);
        }
        $(section).find('div[data-page="' + json.pageId + '"]').find('div.widgetcontainer').sort(function(a,b) {
             return $(a).data('order') > $(b).data('order');
        }).appendTo('div[data-page="' + json.pageId + '"]');
    },
    addPage: function(page) {
        $('label').filter('[data-pagination="0"]').parent().removeClass('hide');
        if ($('div').filter('[data-page="' + page.pageId + '"]').exists() == false) {
            if ($('label').filter('[data-pagination="0"]').find('input').prop('checked') == true) {
                var html = '<div class="row page" data-page="' + page.pageId + '"></div>';
            } else {
                var html = '<div class="row page hide" data-page="' + page.pageId + '"></div>';
            }
            $('section.content').filter('[data-section="dashboard"]').append(html);
        }
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
                $('div.page').addClass('hide');
                $('div.page').filter('[data-page="' + pageId + '"]').removeClass('hide');
            });
        }
    },
    simulateDevices: function() {
        //this.mqttClient.publish('/iotcc/' + mqttConfig.clientId + '/device', '{"command":"getDevice","param":""}', {qos: 1, retained: false});
        this.mqttClient.publish('/iotcc/heater1/device', '{"name":"House heating 1","desc":"", "pages" : [{"pageId" : 10, "pageName" : "House heating", "icon": "ion-ios-home"}]}', {qos: 1, retained: false});
        this.mqttClient.publish('/iotcc/heater1/heater/config', '{"id":"100", "pageName": "House heating", "pageId": 10, "widget":"radios", "title":"Hollway Heater", "topic":"/iotcc/heater1/heater", "options":[{"checked":true, "label": "Off", "status":"1"}, {"label": "Confort", "status":"2"}, {"label": "Anti freeze", "status":"3"}, {"label": "Confort -2", "status":"4"}], "template": "template-3", "icon": "ion-ios-home", "bgcolor": "bg-blue", "order": 40}', {qos: 1, retained: false});

        this.mqttClient.publish('/iotcc/heater2/device', '{"name":"House heating 2","desc":"", "pages" : [{"pageId" : 10, "pageName" : "House heating", "icon": "ion-ios-home"}]}', {qos: 1, retained: false});
        this.mqttClient.publish('/iotcc/heater2/heater/config', '{"id":"101", "pageName": "House heating", "pageId": 10, "widget":"radios", "title":"Kitchen Heater", "topic":"/iotcc/heater2/heater", "options":[{"checked":true, "label": "Off", "status":"1"}, {"label": "Confort", "status":"2"}, {"label": "Anti freeze", "status":"3"}, {"label": "Confort -2", "status":"4"}], "template": "template-3", "icon": "ion-ios-home", "bgcolor": "bg-blue", "order": 30}', {qos: 1, retained: false});

        this.mqttClient.publish('/iotcc/heater3/device', '{"name":"House heating 3","desc":"", "pages" : [{"pageId" : 10, "pageName" : "House heating", "icon": "ion-ios-home"}]}', {qos: 1, retained: false});
        this.mqttClient.publish('/iotcc/heater3/heater/config', '{"id":"102", "pageName": "House heating", "pageId": 10, "widget":"radios", "title":"Bedroom Heater", "topic":"/iotcc/heater3/heater", "options":[{"checked":true, "label": "Off", "status":"1"}, {"label": "Confort", "status":"2"}, {"label": "Anti freeze", "status":"3"}, {"label": "Confort -2", "status":"4"}], "template": "template-3", "icon": "ion-ios-home", "bgcolor": "bg-blue", "order": 10}', {qos: 1, retained: false});

        this.mqttClient.publish('/iotcc/heater4/device', '{"name":"House heating 4","desc":"", "pages" : [{"pageId" : 10, "pageName" : "House heating", "icon": "ion-ios-home"}]}', {qos: 1, retained: false});
        this.mqttClient.publish('/iotcc/heater4/heater/config', '{"id":"103", "pageName": "House heating", "pageId": 10, "widget":"radios", "title":"Living Heater", "topic":"/iotcc/heater4/heater", "options":[{"checked":true, "label": "Off", "status":"1"}, {"label": "Confort", "status":"2"}, {"label": "Anti freeze", "status":"3"}, {"label": "Confort -2", "status":"4"}], "template": "template-3", "icon": "ion-ios-home", "bgcolor": "bg-blue", "order": 20}', {qos: 1, retained: false});

        this.mqttClient.publish('/iotcc/dogsheating/device', '{"name":"Dogs heating","desc":"", "pages" : [{"pageId" : 20, "pageName" : "Dogs heating", "icon": "ion-ios-paw"}]}', {qos: 1, retained: false});
        this.mqttClient.publish('/iotcc/dogsheating/toggle1/config', '{"id":"200", "pageName": "Dogs heating", "pageId": 20, "widget":"toggle", "title":"Mara", "topic":"/iotcc/dogsheating/toggle1", "checked":true, "template": "template-1", "icon": "ion-ios-paw", "bgcolor": "bg-green", "order" : 10}', {qos: 1, retained: false});
        this.mqttClient.publish('/iotcc/dogsheating/toggle2/config', '{"id":"201", "pageName": "Dogs Heating", "pageId": 20, "widget":"toggle", "title":"Linda", "topic":"/iotcc/dogsheating/toggle2", "template": "template-1", "icon": "ion-ios-paw", "bgcolor": "bg-green", "order" : 20}', {qos: 1, retained: false});

        this.mqttClient.publish('/iotcc/outdoorlights1/device', '{"name":"Outdoor lighting 1","desc":"", "pages" : [{"pageId" : 30, "pageName" : "Outdoor Lights", "icon": "ion-ios-home"}]}', {qos: 1, retained: false});
        this.mqttClient.publish('/iotcc/outdoorlights1/garage/config', '{"id":"300", "pageName": "Outdoor lightling", "pageId": 30, "widget":"toggle", "title":"Garage", "topic":"/iotcc/outdoorlights/garage", "checked":true, "template": "template-1", "icon": "ion-model-s", "bgcolor": "bg-orange", "order": 40}', {qos: 1, retained: false});

        this.mqttClient.publish('/iotcc/outdoorlights2/device', '{"name":"Outdoor lighting 2","desc":"", "pages" : [{"pageId" : 30, "pageName" : "Outdoor Lights", "icon": "ion-ios-home"}]}', {qos: 1, retained: false});
        this.mqttClient.publish('/iotcc/outdoorlights2/house1/config', '{"id":"301", "pageName": "Outdoor lightling", "pageId": 30, "widget":"toggle", "title":"House front", "topic":"/iotcc/outdoorlights/house1", "template": "template-1", "icon": "ion-ios-home", "bgcolor": "bg-orange", "order": 10}', {qos: 1, retained: false});

        this.mqttClient.publish('/iotcc/outdoorlights3/device', '{"name":"Outdoor lighting 3","desc":"", "pages" : [{"pageId" : 30, "pageName" : "Outdoor Lights", "icon": "ion-ios-home"}]}', {qos: 1, retained: false});
        this.mqttClient.publish('/iotcc/outdoorlights3/house2/config', '{"id":"302", "pageName": "Outdoor lightling", "pageId": 30, "widget":"toggle", "title":"House back", "topic":"/iotcc/outdoorlights/house2", "template": "template-1", "icon": "ion-ios-home", "bgcolor": "bg-orange", "order": 20}', {qos: 1, retained: false});

        this.mqttClient.publish('/iotcc/outdoorlights4/device', '{"name":"Outdoor lighting 4","desc":"", "pages" : [{"pageId" : 30, "pageName" : "Outdoor Lights", "icon": "ion-ios-home"}]}', {qos: 1, retained: false});
        this.mqttClient.publish('/iotcc/outdoorlights4/house3/config', '{"id":"302", "pageName": "Outdoor lightling", "pageId": 30, "widget":"toggle", "title":"House sides", "topic":"/iotcc/outdoorlights/house3", "template": "template-1", "icon": "ion-ios-home", "bgcolor": "bg-orange", "order": 30}', {qos: 1, retained: false});
    },
    saveConfig: function() {
        var config = {
            'clientId': $('#mqttClientId').val(),
            'host': $('#mqttHost').val(),
            'port': $('#mqttPort').val(),
            'username': $('#mqttUser').val(),
            'password': $('#mqttPass').val(),
            'secure': $('#mqttSecure').prop('checked'),
            'debug': $('#mqttDebug').prop('checked'),
            'simulateDevices': $('#mqttSimulateDevices').prop('checked'),
        };

        try {
            localStorage.setItem('mqttConfig', JSON.stringify(config));
            iotCC.showNotification('MQTT connection data', 'Data saved succesfully', 'settings', 'info', 3);
        } catch(ex) {
            iotCC.showNotification('MQTT connection data', 'Cannot save data to local storage', 'settings', 'danger', 5);
        }
    },
    getConfig: function() {
        try {
            var config = JSON.parse(localStorage.getItem('mqttConfig'));
            $('#mqttClientId').val(config.clientId);
            $('#mqttHost').val(config.host);
            $('#mqttPort').val(config.port);
            $('#mqttUser').val(config.username);
            $('#mqttPass').val(config.password);
            $('#mqttSecure').prop('checked', config.secure);
            $('#mqttDebug').prop('checked', config.debug);
            $('#mqttSimulateDevices').prop('checked', config.simulateDevices);
        } catch(ex){
            return;
        }
        return config;
    },
    showNotification: function(title, content, section, cls, timer) {
        $('div.notification-' + section).removeClass('hide').addClass('callout-' + cls);
        $('div.notification-' + section).find('span').html(content);
        $('div.notification-' + section).find('h4').html(title);
        if (timer != undefined) {
            setTimeout(function(){
                $('div.notification-' + section).addClass('hide');
            }, timer * 1000)
        }
    }
}

jQuery.fn.exists = function(){return ($(this).length > 0);}
 $(document).ready(function(){
    iotCC.init();

    $('.navigation').click(function(e){
        e.preventDefault();
        var section = $(this).data('section');
        $('.navigation').parent().removeClass('active');
        $(this).parent().addClass('active');
        $('section.content,section.content-header').addClass('hide');
        $('section.content,section.content-header').filter('[data-section="' + section + '"]').removeClass('hide');
    });

    $('label').filter('[data-pagination="0"]').click(function(e){
         $('div.page').removeClass('hide');
    });

    $('#saveMqttConfig').click(function(e){
        e.preventDefault();
        iotCC.saveConfig();
    });
});

// custom console
logger = new Object();
logger.log = function(log) {
    $('.console').prepend(log + '<br />');
};
