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
            this.mqttConfig = {
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
                rejectUnauthorized: false
            };
            this.mqttConfig = Object.assign(mqttConfig, this.mqttConfig);
            this.init();
            if (this.mqttConfig.simulateDevices) {
                this.simulateDevices();
            }
        }

        init() {
            var client = this.client = mqtt.connect('ws' + (this.mqttConfig.secure?'s':'') + '://' + this.mqttConfig.host + ':' + this.mqttConfig.port, this.mqttConfig);

            this.client.on('error', function (err) {
                console.log(err);
                client.end();
            });

            this.client.on('connect', function () {
                console.log('client connected:' + mqttConfig.clientId);
            });

            this.client.subscribe('/iotcc/+/+/config', {qos: 1});
            this.client.subscribe('/iotcc/+/+/data', {qos: 1});
            this.client.subscribe('/iotcc/+/device', {qos: 1});

            this.client.on('message', function (topic, message, packet) {
                //console.log('Received Message:= ' + message.toString() + '\nOn topic:= ' + topic);
                var topicPath = topic.split('/');
                if (topicPath[4] == 'config') {
                    console.log('Received config:= ' + message.toString() + '\nOn topic:= ' + topic);
                    var json = JSON.parse(message.toString());
                    var widgetClass = iotCC.formatTopic(json.topic);
                    if (json.widget == 'toggle') {
                        if ($('.' + widgetClass).exists() == false) {
                            var html = '<label class="switch"><input type="checkbox" class="' + widgetClass + 'click switch__input" ' + (json.checked==true?'checked="checked" status="1"':'status="0"') + '><div class="switch__toggle"><div class="switch__handle"></div></div></label>';
                            iotCC.addList(json, html, widgetClass);
                            $('.' + widgetClass + 'click').click(function(){
                                if ($(this).attr('checked')) {
                                    $(this).removeAttr('checked').attr('status', 0);
                                    client.publish(json.topic + '/data', '{"status":0}', {qos: 1, retained: false});
                                } else {
                                    $(this).attr('checked', 'checked').attr('status', 1);
                                    client.publish(json.topic + '/data', '{"status":1}', {qos: 1, retained: false});
                                }
                            });
                        }
                    } else if (json.widget == 'list') {
                        var html = '';
                        $(json.options).each(function(k,v){
                            html += '<label class="radio-button radio-button--material ' + widgetClass + 'click" data-status="' + v.status + '"><input type="radio" class="radio-button__input radio-button--material__input" name="r" ' + (v.checked==true?'checked="checked"':'') + '><div class="radio-button__checkmark radio-button--material__checkmark"></div>'+ v.label +'</label>';
                        });
                        if ($('.' + widgetClass).exists() == false) {
                            iotCC.addList(json, html, widgetClass);
                            $('.' + widgetClass + 'click').click(function(){
                                client.publish(json.topic + '/data', '{"status":"' + $(this).data('status') + '"}', {qos: 1, retained: false});
                            });
                        }
                    }
                } else if (topicPath[4] == 'data') {
                    console.log('Received data:= ' + message.toString() + '\nOn topic:= ' + topic);
                    var json = JSON.parse(message.toString());
                    var widgetClass = iotCC.formatTopic(topic);
                    if ($('.' + widgetClass + 'click').filter('[data-status="' + json.status + '"]').exists() == true) {
                        $('.' + widgetClass + 'click').find('input').removeAttr('checked');
                        $('.' + widgetClass + 'click').filter('[data-status="' + json.status + '"]').find('input').attr('checked', 'checked');
                    } else if ($('.' + widgetClass + 'click').exists() == true) {
                        $('.' + widgetClass + 'click').attr('checked', 'checked');
                    }
                } else if (topicPath[3] == 'device') {
                    console.log('Received device:= ' + message.toString() + '\nOn topic:= ' + topic);
                    var json = JSON.parse(message.toString());
                    $(json.pages).each(function(k,page){
                        if ($('label.page' + page.pageId).exists() == false) {
                            $('.pages').append(iotCC.addPage(page));
                            $('.page').click(function(){
                                $('.pag').hide();
                                $('.pag' + $(this).attr('page')).show();
                            });
                        }
                    });
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

            //this.client.publish('/iotcc/relays1/device', '{"name":"2 relays","desc":"on a board", "pages" : [{"pageId" : 10, "pageName" : "Page 1"}, {"pageId" : 20, "pageName" : "Page 2"}]}', {qos: 1, retained: false});
            //this.client.publish('/iotcc/relays1/toggle1/config', '{"id":"10", "page": "Page 1", "pageId": 10, "widget":"toggle", "descr":"Relay 1", "topic":"/iotcc/relays1/toggle1"}', {qos: 1, retained: false});
            //this.client.publish('/iotcc/relays1/toggle2/config', '{"id":"11", "page": "Page 2", "pageId": 20, "widget":"toggle", "descr":"Relay 2", "topic":"/iotcc/relays1/toggle2"}', {qos: 1, retained: false});
            //
            this.client.publish('/iotcc/heater1/heater1/config', '{"id":"100", "page": "Page 1", "pageId": 10, "widget":"list", "label":"Header 1", "topic":"/iotcc/relays/heater1", "options":[{"checked":true, "label": "Off", "status":"1"}, {"label": "Confort", "status":"2"}, {"label": "Anti freeze", "status":"3"}, {"label": "Confort -2", "status":"4"}]}', {qos: 1, retained: false});
        }

        static formatTopic(topic) {
            return topic.replace(/\//gi, '_').replace(/:/gi, '_').replace('_data', '');
        }

        static addList(json, content, widgetClass) {
            var html = '';
            html += '<ul class="list pag pag' + json.pageId +' ' + widgetClass +'">';
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