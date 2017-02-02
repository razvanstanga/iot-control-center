var appOptions = {
    templateDebug: false,
    pageContainer: true
};

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
        debug: false,
    },
    mqttConfig: {},
    mqttClient: null,
    templates: [],
    events: {
        'connect': [],
        'message': []
    },
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

        this.showNotification('Connecting to MQTT server', 'Trying to connect to ' + this.mqttConfig.host + ':' + this.mqttConfig.port, 'dashboard', 'info');

        this.mqttClient = mqtt.connect('ws' + (this.mqttConfig.secure==true?'s':'') + '://' + this.mqttConfig.host + ':' + this.mqttConfig.port, this.mqttConfig);

        this.mqttClient.on('error', function(err) {
            logger.log('Error' + err);
            iotCC.mqttClient.end();
        });

        this.mqttClient.on('connect', function() {
            if (iotCC.mqttConfig.debug) logger.log('client connected:' + iotCC.mqttConfig.clientId);
            iotCC.showNotification('Connected to MQTT server ' + iotCC.mqttConfig.host + ':' + iotCC.mqttConfig.port, 'Waiting to receive data from devices.', 'dashboard', 'info');

            for(var callback in iotCC.events.connect) {
                try {
                    iotCC.events.connect[callback]();
                } catch (err) {
                    logger.log ('connect callback error');
                    logger.log (err);
                }
            }
        });

        this.mqttClient.subscribe('/iotcc/+/+/config', {qos: 1});
        this.mqttClient.subscribe('/iotcc/+/+/data', {qos: 1});
        this.mqttClient.subscribe('/iotcc/+/device', {qos: 1});

        this.refreshDevices();

        this.mqttClient.on('message', function(topic, message, packet) {
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
                        html = '<label class="switch switch--material {class4}">';
                        html += '<input type="checkbox" name="' + widgetId + '" data-widget="toggle" data-status="' + (json.checked==true?'1':'0') + '" class="switch__input switch--material__input {class5}" ' + (json.checked==true?'checked="checked"':'') + '>';
                        html += '<div class="switch__toggle switch--material__toggle {class6}">';
                        html += '<div class="switch__handle switch--material__handle {class7}">';
                        html += '</div>';
                        html += '</div>';
                        html += '</label>';
                        json.content = html;
                        json.widgetId = widgetId;
                        json.selector = 'input';
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
                    } else {
                        iotCC.animate($('input[name="' + widgetId + '"]').closest(".widgetcontainer"));
                    }
                } else if (json.widget == 'radios') {
                    html = '';
                    $(json.options).each(function(k, v) {
                        html += '<label class="radio-button radio-button--material {class3}">';
                        html += '<input type="radio" name="' + widgetId + '" data-widget="radios" data-status="' + v.status + '" class="radio-button__input radio-button--material__input {class4}" name="r" ' + (v.checked==true?'checked="checked"':'') + '>';
                        html += '<div class="radio-button__checkmark radio-button--material__checkmark {class5}">';
                        html += '</div>';
                        html += v.label +'</label>';
                    });
                    if ($('input[name="' + widgetId + '"]').exists() == false) {
                        json.content = html;
                        json.widgetId = widgetId;
                        json.selector = 'input';
                        json.callback = function() {
                            iotCC.mqttClient.publish(json.topic + '/data', '{"status":"' + $(this).data('status') + '"}', {qos: 1, retained: false});
                        };
                        iotCC.addWidget(json);
                    } else {
                        iotCC.animate($('input[name="' + widgetId + '"]').closest(".widgetcontainer"));
                    }
                } else if (json.widget == 'data' || json.widget == 'data-control') {
                    html = '';
                    if (json.widget == 'data-control') html += '<button name="' + widgetId + '" data-widget="' + json.widget + '" data-action="-" class="button button--material btn-xs">-</button> ';
                    html += '<span name="' + widgetId + '" data-widget="' + json.widget + '" data-value="' + json.value + '" class="text">' + json.value + '</span> ' + (json.valuedescription?'<span class="text">' + json.valuedescription + '</span>':'') + '';
                    if (json.widget == 'data-control') html += ' <button name="' + widgetId + '" data-widget="' + json.widget + '" data-action="+" class="button button--material btn-xs">+</button>';
                    if ($('span[name="' + widgetId + '"]').exists() == false) {
                        json.content = html;
                        json.widgetId = widgetId;
                        json.selector = 'button';
                        json.callback = function() {
                            var action = $(this).data('action');
                            var value = $('span[name="' + $(this).attr('name') + '"]').data('value');
                            value = action == '+' ? iotCC.formatData(value, json.format) + 1 : iotCC.formatData(value, json.format) - 1;
                            iotCC.mqttClient.publish(json.topic + '/data', '{"value":"' + value + '"}', {qos: 1, retained: false});
                        };
                        iotCC.addWidget(json);
                    } else {
                        iotCC.animate($('span[name="' + widgetId + '"]').closest(".widgetcontainer"));
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
                } else if (widget == 'data' || widget == 'data-control') {
                    if ($('span[name="' + widgetId + '"]').exists() == true) {
                        $('span[name="' + widgetId + '"]').html(json.value).data('value', json.value);
                    }
                }
            } else if (topicPath[3] == 'device') {
                $(json.pages).each(function(k, page) {
                    iotCC.addPage(page);
                });
            }
            for(var callback in iotCC.events.message) {
                try {
                    iotCC.events.message[callback](json, widgetId, topic, topicPath);
                } catch (err) {
                    logger.log ('message callback error');
                    logger.log (err);
                }
            }
        });

        this.mqttClient.on('close', function() {
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
        html = this.parseTemplate(json, html);
        var section = $('section.content').filter('[data-section="dashboard"]');
        // TODO: add after sort ?
        var widgets = $(section).find('div[data-page="' + json.pageId + '"]').find('div.widgetcontainer').length;
        if (widgets > 0 && widgets%2 == 0) {
            //$(section).find('div[data-page="' + json.pageId + '"]').append('<div class="clearfix visible-sm-block" data-order="' + json.order + '"></div>');
        }

        $(section).find('div.page[data-page="' + json.pageId + '"]').append(html);
        if (json.callback != undefined) {
            $(json.selector + '[name="' + json.widgetId + '"]').click(json.callback);
        }
        $(section).find('div.page[data-page="' + json.pageId + '"]').find('div.widgetcontainer').sort(function(a,b) {
             return $(a).data('order') > $(b).data('order');
        }).appendTo('div.page[data-page="' + json.pageId + '"]');
        $(section).find('div.page[data-page="' + json.pageId + '"]').find('div.visible-sm-block').remove();
        $(section).find('div.page[data-page="' + json.pageId + '"]').find('div.widgetcontainer').each(function(k,v){
            if ((k+1)%2 == 0) {
                $(v).after('<div class="clearfix visible-sm-block"></div>');
            }
        });
    },
    addPage: function(page) {
        $('label').filter('[data-pagination="0"]').parent().removeClass('hide');
        if ($('div').filter('[data-page="' + page.pageId + '"]').exists() == false) {
            if ($('label').filter('[data-pagination="0"]').find('input').prop('checked') == true) {
                var html = '<div class="row page" data-page="' + page.pageId + '" data-order="' + page.order + '"></div>';
            } else {
                var html = '<div class="row page hide" data-page="' + page.pageId + '" data-order="' + page.order + '"></div>';
            }
            if (appOptions.pageContainer) {
                var html2 = '<div class="box pagecontainer {class}" data-page="' + page.pageId + '" data-order="' + page.order + '">';
                html2 += '<div class="box-header with-border {class1}">';
                html2 += '<h3 class="box-title {class2}">' + page.pageName + '</h3>';
                if (page.icon) html2 += '<div class="box-tools pull-right ' + page.icon + '"></div>';
                html2 += '</div>';
                html2 += '<div class="box-body {class4}">';
                html2 += html;
                html2 += '</div>';
                html2 += '</div>';
                html2 = this.parseTemplate(page, html2);
                $('section.content[data-section="dashboard"]').append(html2);
                $('section.content[data-section="dashboard"]').find('div.pagecontainer').sort(function(a,b) {
                     return $(a).data('order') > $(b).data('order');
                }).appendTo('section.content[data-section="dashboard"]');
            } else {
                $('section.content').filter('[data-section="dashboard"]').append(html);
                $('section.content').find('div.page').sort(function(a,b) {
                     return $(a).data('order') > $(b).data('order');
                }).appendTo('section.content[data-section="dashboard"]');
            }
        }
        if ($('div.pagination').find('label').filter('[data-pagination="' + page.pageId + '"]').exists() == false) {
            var html = '<label class="tab-bar__item tab-bar--material__item" data-pagination="' + page.pageId + '" data-order="' + page.order + '">';
            html += '<input type="radio" name="tab-bar-material-a">';
            html += '<button class="tab-bar__button tab-bar--material__button">';
            html += '<i class="tab-bar__icon tab-bar--material__icon ' + page.icon + '"></i>';
            html += '<div class="tab-bar__label tab-bar--material__label">' + page.pageName + '</div>';
            html += '</button>';
            html += '</label>';
            $('.pagination').append(html);
            $('label').filter('[data-pagination="' + page.pageId + '"]').click(function(e){
                var pageId = $(this).data('pagination');
                if (appOptions.pageContainer) {
                    $('div.pagecontainer').addClass('hide');
                    $('div.pagecontainer').filter('[data-page="' + pageId + '"]').removeClass('hide');
                } else {
                    $('div.page').addClass('hide');
                    $('div.page').filter('[data-page="' + pageId + '"]').removeClass('hide');
                }
            });
            $('div.pagination').find('label').sort(function(a, b) {
                 return $(a).data('order') > $(b).data('order');
            }).appendTo('div.pagination');
        }
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
            this.getConfig();
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
            this.mqttConfig = Object.assign(this.mqttDefaultConfig, config);
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
            setTimeout(function() {
                $('div.notification-' + section).addClass('hide');
            }, timer * 1000);
        }
    },
    refreshDevices: function() {
        this.mqttClient.publish('/iotcc/device', '{"clientId": "' + this.mqttConfig.clientId + '"}', {qos: 1, retained: false});
    },
    addEvent: function(on, callback) {
        if (on == 'connect') {
            this.events.connect.push(callback);
        } else if (on == 'message') {
            this.events.message.push(callback);
        }
    },
    animate: function(element) {
        element.fadeTo("fast", 0.33 ).fadeTo("fast", 1);
    },
    formatData: function(v, f, d) {
        if (f == 'int') {
            return parseInt(v);
        } else if (f == 'float') {
            return parseFloat(v).toFixed(d);
        }
    },
    parseTemplate: function(json, html) {
        for (var key in json) {
            html = html.replace('{' + key + '}', json[key]);
        }
        if (appOptions.templateDebug == false) {
            html = html.replace(/{(\w*)}/g, '');
        }
        return html;
    }
}

jQuery.fn.exists = function(){return ($(this).length > 0);}
 $(document).ready(function(){

    $('.navigation').click(function(e){
        e.preventDefault();
        var section = $(this).data('section');
        $('.navigation').parent().removeClass('active');
        $(this).parent().addClass('active');
        $('section.content,section.content-header').addClass('hide');
        $('section.content,section.content-header').filter('[data-section="' + section + '"]').removeClass('hide');
    });

    $('label').filter('[data-pagination="0"]').click(function(e){
        if (appOptions.pageContainer) {
            $('div.pagecontainer').removeClass('hide');
        } else {
            $('div.page').removeClass('hide');
        }
    });

    $('#saveMqttConfig').click(function(e){
        e.preventDefault();
        iotCC.saveConfig();
    });

    $('#saveOptions').click(function(e){
        e.preventDefault();
        var config = {
            'pageContainer': $('#pageContainer').prop('checked'),
            'templateDebug': $('#templateDebug').prop('checked'),
        };

        try {
            localStorage.setItem('appOptions', JSON.stringify(config));
            iotCC.showNotification('Options', 'Data saved succesfully', 'settings', 'info', 3);
        } catch(ex) {
            iotCC.showNotification('Options', 'Cannot save data to local storage', 'settings', 'danger', 5);
        }
    });

    appOptions = Object.assign(appOptions, JSON.parse(localStorage.getItem('appOptions')));
    for(var key in appOptions) {
        var value = appOptions[key];
        if (value == true || false) {
            $('input[name="' + key + '"]').prop("checked", value);
        } else {
            $('input[name="' + key + '"]').val(value);
        }
    }

    $('a').filter('[data-toggle="control-refresh"]').click(function(e){
        e.preventDefault();
        iotCC.refreshDevices();
    });
    iotCC.init();
});

// custom console
logger = new Object();
logger.log = function(log) {
    $('.console').prepend(log + '<br />');
};
