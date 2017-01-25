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

            this.client.subscribe('/IoTmanager/+/config', {qos: 1});
            this.client.subscribe('/IoTmanager/+/+/status', {qos: 1});
            this.client.subscribe('/IoTmanager/+/response', {qos: 1});

            this.client.publish('/IoTmanager/' + mqttConfig.clientId + '/request', '{"command":"getPages","param":""}', { qos: 1, retained: false });

            this.client.on('message', function (topic, message, packet) {
                //console.log('Received Message:= ' + message.toString() + '\nOn topic:= ' + topic)
                var topicPath = topic.split('/');
                if (topicPath[3] == 'config') {
                    console.log('Received config:= ' + message.toString() + '\nOn topic:= ' + topic)
                    var json = JSON.parse(message.toString());
                    var id = iotCC.formatTopic(json.topic);
                    if (json.widget == 'toggle') {
                        if ($('.' + id).exists() == false) {
                            //$('.container').prepend('<input type="checkbox" class="' + id +'" value="">');
                            $('.container').prepend(iotCC.addList(json.descr, json.pageId, '<label class="switch"><input type="checkbox" class="' + id +' switch__input"><div class="switch__toggle"><div class="switch__handle"></div></div></label>'));
                            $('.' + id).click(function(){
                                if ($(this).attr('checked') == 'checked') {
                                    $(this).attr('checked', '');
                                    client.publish(json.topic + '/control', '0', { qos: 1, retained: false });
                                } else {
                                    $(this).attr('checked', 'checked');
                                    client.publish(json.topic + '/control', '1', { qos: 1, retained: false });
                                }
                            });
                        }
                    }
                } else if (topicPath[4] == 'status') {
                    console.log('Received status:= ' + message.toString() + '\nOn topic:= ' + topic)
                    var json = JSON.parse(message.toString());
                    var id = iotCC.formatTopic(topic);
                    if ($('.' + id).exists() == true) {
                        if (json.status == 1) {
                            $('.' + id).attr('checked', 'checked');
                        } else if ( json.status == 0 ) {
                            $('.' + id).attr('checked', false);
                        }
                    }
                } else if (topicPath[3] == 'response') {
                    console.log('Received response:= ' + message.toString() + '\nOn topic:= ' + topic)
                    var json = JSON.parse(message.toString());
                    $(json.pages).each(function(k,page){
                        $('.pages').append(iotCC.addPage(page));
                        $('.page').click(function(){
                            $('.pag').hide();
                            $('.pag' + $(this).attr('page')).show();
                        });
                        client.publish('/IoTmanager/' + mqttConfig.clientId +  '/request', '{"command":"getPageById","param":"' + page.pageId + '"}', { qos: 1, retained: false });
                    });
                }
            });

            this.client.on('close', function () {
                console.log(mqttConfig.clientId + ' disconnected')
            });
        }

        static formatTopic(topic) {
            return topic.replace(/\//gi, '_').replace(/:/gi, '_').replace('_status', '');
        }

        static addList(label, pageId, button) {
            var html = '';
            html += '<ul class="list pag pag' + pageId +'">';
            html += '<li class="list__item">';
            html += '<div class="list__item__center">';
            html += label;
            html += '</div>';
            html += '<div class="list__item__right">';
            html += button;
            html += '</div>';
            html += '</li>';
            html += '</ul>';
            return html;
        }

        static addPage(page) {
            var html = '';
            html += '<label class="tab-bar__item page" page="' + page.pageId +'">';
            html += '<input type="radio" name="tab-bar-a">';
            html += '<button class="tab-bar__button">';
            html += '<i class="tab-bar__icon ' + ((page.icon!=undefined)?page.icon:'ion-star') + '"></i>';
            html += '<div class="tab-bar__label">' + page.pageName + '</div>';
            html += '</button>';
            html += '</label>';
            return html;
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