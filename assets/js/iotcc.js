"use strict";

(function(mqttConfig) {
    if (mqttConfig == undefined) {
        console.log ('mqttConfig is not defined in config.js. see config.sample.js');
        return;
    } else if (typeof jQuery == 'undefined') {
        console.log ('IoT Control center requires jQuery');
        return;
    }
    class iotCC {
        constructor(mqttConfig) {
            var mqttDefaultConfig = {
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
            };
            mqttConfig = Object.assign(mqttDefaultConfig, mqttConfig);
            this.init();
            if (mqttConfig.simulateDevices) {
                this.simulateDevices();
            }
        }

        init() {
            var client = this.client = mqtt.connect('ws' + (mqttConfig.secure==true?'s':'') + '://' + mqttConfig.host + ':' + mqttConfig.port, mqttConfig);

            this.client.on('error', function (err) {
                console.log(err);
                client.end();
            });

            this.client.on('connect', function () {
                if (mqttConfig.debug) console.log('client connected:' + mqttConfig.clientId);
            });

            this.client.subscribe('/iotcc/+/+/config', {qos: 1});
            this.client.subscribe('/iotcc/+/+/data', {qos: 1});
            this.client.subscribe('/iotcc/+/device', {qos: 1});

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

            this.client.on('message', function (topic, message, packet) {
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

                if (mqttConfig.debug) {
                    console.log('Received Topic:= ' + topic + '\n\tMessage:= ' + message.toString());
                }

                if (topicPath[4] == 'config') {
                    if (json.widget == 'toggle') {
                        if ($('input[name="' + widgetId + '"]').exists() == false) {
                            html = '<label class="switch"><input name="' + widgetId + '" data-status="' + (json.checked==true?'1':'0') + '" data-widget="toggle" type="checkbox" class="switch__input" ' + (json.checked==true?'checked="checked"':'') + '><div class="switch__toggle"><div class="switch__handle"></div></div></label>';
                            iotCC.addList(json, html, widgetId);
                            $('input[name="' + widgetId + '"]').click(function(){
                                if ($(this).prop('checked') == true) {
                                    $(this).data('status', 1);
                                    client.publish(json.topic + '/data', '{"status":1}', {qos: 1, retained: false});
                                } else {
                                    $(this).data('status', 0);
                                    client.publish(json.topic + '/data', '{"status":0}', {qos: 1, retained: false});
                                }
                            });
                        }
                    } else if (json.widget == 'radios') {
                        html = '';
                        $(json.options).each(function(k, v) {
                            html += '<label class="radio-button radio-button--material"><input name="' + widgetId + '" data-status="' + v.status + '" data-widget="radios" type="radio" class="radio-button__input radio-button--material__input" name="r" ' + (v.checked==true?'checked="checked"':'') + '><div class="radio-button__checkmark radio-button--material__checkmark"></div>'+ v.label +'</label>';
                        });
                        if ($('input[name="' + widgetId + '"]').exists() == false) {
                            iotCC.addList(json, html, widgetId);
                            $('input[name="' + widgetId + '"]').click(function() {
                                client.publish(json.topic + '/data', '{"status":"' + $(this).data('status') + '"}', {qos: 1, retained: false});
                            });
                        }
                    }
                } else if (topicPath[4] == 'data') {
                    widget = $('input[name="' + widgetId + '"]').first().data('widget');
                    if (widget == 'toggle') {
                        if ($('input[name="' + widgetId + '"]').exists() == true) {
                            if (json.status == 1) {
                                $('input[name="' + widgetId + '"]').prop('checked', true);
                                $('input[name="' + widgetId + '"]').data('status', 1);
                            } else {
                                $('input[name="' + widgetId + '"]').prop('checked', false);
                                $('input[name="' + widgetId + '"]').data('status', 0);
                            }
                        }
                    } else if (widget == 'radios') {
                        if ($('input[name="' + widgetId + '"]').filter('[data-status="' + json.status + '"]').exists() == true) {
                            $('input[name="' + widgetId + '"]').filter('[data-status="' + json.status + '"]').prop('checked', true);
                        }
                    }
                } else if (topicPath[3] == 'device') {
                    $(json.pages).each(function(k, page) {
                        if ($('label.page' + page.pageId).exists() == false) {
                            $('.pages').append(iotCC.addPage(page));
                            $('.page').click(function(){
                                $('.pag').hide();
                                $('.pag' + $(this).attr('page')).show();
                            });
                        }
                    });
                }
                if (typeof(window['iotCCMessageEvents']) != 'undefined') {
                    for(var i in iotCCMessageEvents) {
                        try {
                            window[iotCCMessageEvents[i]](this, topic, topicPath, json, widgetId);
                        } catch (err) {
                            console.log (iotCCMessageEvents[i] + 'is not defined');
                            console.log (err);
                        }
                    }
                }
            });

            this.client.on('close', function () {
                console.log(mqttConfig.clientId + ' disconnected');
            });
        }

        simulateDevices() {
            //this.client.subscribe('/iotcc/+/+/data', {qos: 1});
            this.client.publish('/iotcc/' + mqttConfig.clientId + '/device', '{"command":"getDevice","param":""}', {qos: 1, retained: false});
            this.client.publish('/iotcc/relays/device', '{"name":"2 relays","desc":"on a board", "pages" : [{"pageId" : 10, "pageName" : "Page 1"}, {"pageId" : 20, "pageName" : "Page 2"}]}', {qos: 1, retained: false});
            this.client.publish('/iotcc/relays/toggle1/config', '{"id":"1", "page": "Page 1", "pageId": 10, "widget":"toggle", "label":"Relay 1", "topic":"/iotcc/relays/toggle1", "checked":true}', {qos: 1, retained: false});
            this.client.publish('/iotcc/relays/toggle2/config', '{"id":"2", "page": "Page 2", "pageId": 20, "widget":"toggle", "label":"Relay 2", "topic":"/iotcc/relays/toggle2"}', {qos: 1, retained: false});

            this.client.publish('/iotcc/relays1/device', '{"name":"2 relays","desc":"on a board", "pages" : [{"pageId" : 10, "pageName" : "Page 1"}, {"pageId" : 20, "pageName" : "Page 2"}]}', {qos: 1, retained: false});
            this.client.publish('/iotcc/relays1/toggle1/config', '{"id":"10", "page": "Page 1", "pageId": 10, "widget":"toggle", "label":"Relay 1", "topic":"/iotcc/relays1/toggle1"}', {qos: 1, retained: false});
            this.client.publish('/iotcc/relays1/toggle2/config', '{"id":"11", "page": "Page 2", "pageId": 20, "widget":"toggle", "label":"Relay 2", "topic":"/iotcc/relays1/toggle2"}', {qos: 1, retained: false});

            this.client.publish('/iotcc/heater1/heater/config', '{"id":"100", "page": "Page 1", "pageId": 10, "widget":"radios", "label":"Header 1", "topic":"/iotcc/heater1/heater", "options":[{"checked":true, "label": "Off", "status":"1"}, {"label": "Confort", "status":"2"}, {"label": "Anti freeze", "status":"3"}, {"label": "Confort -2", "status":"4"}]}', {qos: 1, retained: false});
        }

        static formatTopic(topic) {
            return topic.replace(/\//gi, '_').replace(/:/gi, '_').replace('_data', '').replace('_config', '');
        }

        static addList(json, content, widgetId) {
            var html = '';
            html += '<ul class="list pag pag' + json.pageId +' ' + widgetId +'">';
            html += '<li class="list__item">';
            html += '<div class="list__item__center">';
            html += json.label;
            html += '</div>';
            html += '<div class="list__item__right">';
            html += content;
            html += '</div>';
            html += '</li>';
            html += '</ul>';
            $('.content').prepend(html);
        }

        static addPage(page) {
            var html = '';
            html += '<label class="tab-bar__item page page' + page.pageId +'" page="' + page.pageId +'">';
            html += '<input type="radio" name="tab-bar-a">';
            html += '<button class="tab-bar__button">';
            html += '<i class="tab-bar__icon ' + ((page.icon!=undefined)?page.icon:'ion-star') + '"></i>';
            html += '<div class="tab-bar__label">' + page.pageName + '</div>';
            html += '</button>';
            html += '</label>';
            $('.pages').append(html);
        }
    }
    new iotCC(mqttConfig);
}(((typeof(window['mqttConfig']) != 'undefined') ? mqttConfig : undefined)));

jQuery.fn.exists = function(){return ($(this).length > 0);}
$(function(){
    $('.pagall').click(function(){
        $('.pag').show();
    });
});