var iotCC = {
    mqttDefaultConfig: {
        clientId: 'IoTCC_' + Math.random(),
        host: 'm21.cloudmqtt.com',
        port: '33744',
        username: 'uruhdxje',
        password: 'wEpIMxvEFih5',
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
        secure: true,
        debug: true,
        simulateDevices: true,
    },
    mqttConfig: {},
    mqttClient: null,
    templates: [],
    events: {
        'connect': [],
        'message': []
    },
    appConfig: {
        templateDebug: false,
        pageContainer: true
    },
    customSubscriptionWidgetJson: {
        'toggle' : '{"pageName": "Custom", "pageId": 1000, "widget":"toggle", "title":"On/Off Toggle", "template": "template-1", "icon": "ion-ios-home", "class": "bg-orange", "order": 10}',
        'radios': '{"pageName": "Custom", "pageId": 1000, "widget":"radios", "title":"Multiple choice", "options":[{"checked":true, "label": "Off", "status":"1"}, {"label": "Confort", "status":"2"}, {"label": "Anti freeze", "status":"3"}, {"label": "Confort -2", "status":"4"}], "template": "template-3", "icon": "ion-ios-home", "class": "bg-blue", "order": 20}',
        'data': '{"pageName": "Custom", "pageId": 1000, "widget":"data", "title":"Data sensor", "value": "22", "valuedescription": "degrees C", "template": "template-3", "icon": "ion-ios-home", "class": "bg-green", "class2": "text-center", "order": 30}',
        'data-control': '{"pageName": "Custom", "pageId": 1000, "widget":"data-control", "format":"int", "title":"Heater", "value": "22", "valuedescription": "degrees C", "template": "template-3", "icon": "ion-ios-home", "class": "bg-green", "class2": "text-center", "order": 40}',
    },
    charts: {},
    gauges: {},
    init: function() {
        if (typeof jQuery == 'undefined') {
            this.showNotification('jQuery', 'IoT Control Center requires jQuery', 'dashboard-notification', 'danger');
            logger.log ('IoT Control center requires jQuery');
            return;
        }
        this.getConfig();
        // TODO: check for localStorage object

        this.showNotification('Connecting to MQTT server', 'Trying to connect to ' + this.mqttConfig.host + ':' + this.mqttConfig.port, 'dashboard-notification', 'info');

        this.mqttClient = mqtt.connect('ws' + (this.mqttConfig.secure==true?'s':'') + '://' + this.mqttConfig.host + ':' + this.mqttConfig.port, this.mqttConfig);

        this.mqttClient.on('error', function(err) {
            logger.log('Error' + err);
            iotCC.mqttClient.end();
        });

        this.mqttClient.on('connect', function() {
            if (iotCC.mqttConfig.debug) logger.log('client connected:' + iotCC.mqttConfig.clientId);
            iotCC.showNotification('Connected to MQTT server ' + iotCC.mqttConfig.host + ':' + iotCC.mqttConfig.port, 'Waiting to receive data from devices.', 'dashboard-notification', 'info');

            for(var callback in iotCC.events.connect) {
                try {
                    iotCC.events.connect[callback]();
                } catch (err) {
                    logger.log ('connect callback error');
                    logger.log (err);
                }
            }
        });

        this.mqttClient.subscribe('/+/+/+/config', {qos: 1});
        this.mqttClient.subscribe('/+/+/+/data', {qos: 1});
        this.mqttClient.subscribe('/+/+/device', {qos: 1});

        this.refreshDevices();
        this.customSubscriptions();

        this.mqttClient.on('message', function(topic, message, packet) {
            iotCC.handleCustomSubscriptions(topic, message);
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
            $('.dashboard-notification-html').remove();
            logger.log('Received Topic:= ' + topic + '\n\tMessage:= ' + message.toString());

            if (topicPath[4] == 'config') {
                var page = {'pageId': json.pageId, 'pageName': json.pageName, 'icon': json.icon};
                iotCC.addPage(page);
                var publishTopic = json.publishTopic ? json.publishTopic : json.topic + '/data';
                if (json.widget == 'toggle') {
                    if ($('input[name="' + widgetId + '"]').exists() == false) {
                        html = '<label class="switch switch--material {class10}">';
                        html += '<input type="checkbox" name="' + widgetId + '" data-widget="toggle" data-status="' + (json.checked==true?'1':'0') + '" class="switch__input switch--material__input {class11}" ' + (json.checked==true?'checked="checked"':'') + '>';
                        html += '<div class="switch__toggle switch--material__toggle {class12}">';
                        html += '<div class="switch__handle switch--material__handle {class13}">';
                        html += '</div>';
                        html += '</div>';
                        html += '</label>';
                        json.content = html;
                        json.widgetId = widgetId;
                        json.selector = 'input';
                        json.callback = function() {
                            if ($(this).prop('checked') == true) {
                                $(this).data('status', 1);
                                var message = '{"status":1}';
                                iotCC.mqttClient.publish(publishTopic, message, {qos: 1, retained: false});
                                if (iotCC.mqttConfig.debug) {
                                    logger.log('Publish Topic:= ' + publishTopic + '\n\tMessage:= ' + message.toString());
                                }
                            } else {
                                $(this).data('status', 0);
                                var message = '{"status":0}';
                                iotCC.mqttClient.publish(publishTopic, message, {qos: 1, retained: false});
                                if (iotCC.mqttConfig.debug) {
                                    logger.log('Publish Topic:= ' + publishTopic + '\n\tMessage:= ' + message);
                                }
                            }
                        };
                        iotCC.addWidget(json);
                    } else {
                        $('input[name="' + widgetId + '"]').prop('checked', json.checked?true:false);
                        iotCC.animate($('input[name="' + widgetId + '"]').closest(".widgetcontainer"));
                    }
                } else if (json.widget == 'radios') {
                    if ($('input[name="' + widgetId + '"]').exists() == false) {
                        html = '';
                        $(json.options).each(function(k, v) {
                            html += '<label class="radio-button radio-button--material {class10}">';
                            html += '<input type="radio" name="' + widgetId + '" data-widget="radios" data-status="' + v.status + '" class="radio-button__input radio-button--material__input {class11}" name="r" ' + (v.checked==true?'checked="checked"':'') + ' />';
                            html += '<div class="radio-button__checkmark radio-button--material__checkmark {class12}"></div>';
                            html += v.label +'</label>';
                        });
                        json.content = html;
                        json.widgetId = widgetId;
                        json.selector = 'input';
                        json.callback = function() {
                            var message = '{"status":"' + $(this).data('status') + '"}';
                            iotCC.mqttClient.publish(publishTopic, message, {qos: 1, retained: false});
                            if (iotCC.mqttConfig.debug) {
                                logger.log('Publish Topic:= ' + publishTopic + '\n\tMessage:= ' + message);
                            }
                        };
                        iotCC.addWidget(json);
                    } else {
                        $(json.options).each(function(k, v) {
                            $('input[name="' + widgetId + '"]').filter('[data-status="' + v.status + '"]').prop('checked', v.checked?true:false);
                        });
                        iotCC.animate($('input[name="' + widgetId + '"]').closest(".widgetcontainer"));
                    }
                } else if (json.widget == 'data' || json.widget == 'data-control') {
                    if ($('span[name="' + widgetId + '"]').exists() == false) {
                        html = '';
                        if (json.widget == 'data-control') html += '<button name="' + widgetId + '" data-widget="' + json.widget + '" data-action="-" class="button button--material btn-xs {class10}">-</button> ';
                        html += '<span name="' + widgetId + '" data-widget="' + json.widget + '" data-value="' + json.value + '" class="text {class11}">' + json.value + '</span> ' + (json.valuedescription?'<span class="text {class12}">' + json.valuedescription + '</span>':'') + '';
                        if (json.widget == 'data-control') html += ' <button name="' + widgetId + '" data-widget="' + json.widget + '" data-action="+" class="button button--material btn-xs {class13}">+</button>';
                        json.content = html;
                        json.widgetId = widgetId;
                        json.selector = 'button';
                        json.callback = function() {
                            var action = $(this).data('action');
                            var value = $('span[name="' + $(this).attr('name') + '"]').data('value');
                            value = action == '+' ? iotCC.formatData(value, json.format) + 1 : iotCC.formatData(value, json.format) - 1;
                            var message = '{"value":"' + value + '"}';
                            iotCC.mqttClient.publish(publishTopic, message, {qos: 1, retained: false});
                            if (iotCC.mqttConfig.debug) {
                                logger.log('Publish Topic:= ' + publishTopic + '\n\tMessage:= ' + message);
                            }
                        };
                        iotCC.addWidget(json);
                    } else {
                        $('span[name="' + widgetId + '"]').html(json.value).data('value', json.value);
                        iotCC.animate($('span[name="' + widgetId + '"]').closest(".widgetcontainer"));
                    }
                } else if (json.widget == 'chart.js') {
                    if ($('canvas[name="' + widgetId + '"]').exists() == false) {
                        html = '';
                        html += '<canvas name="' + widgetId + '" data-widget="' + json.widget + '" data-chart="' + json.chart + '" class="{class10}" width="{width}" height="{height}"></canvas> ' + (json.valuedescription?'<span class="text {class11}">' + json.valuedescription + '</span>':'') + '';
                        json.content = html;
                        json.widgetId = widgetId;
                        iotCC.addWidget(json, function() {
                            iotCC.createChart(widgetId, json);
                        });
                    } else {
                        iotCC.createChart(widgetId, json);
                        iotCC.animate($('canvas[name="' + widgetId + '"]').closest(".widgetcontainer"));
                    }
                } else if (json.widget == 'gauge') {
                    if ($('div[name="' + widgetId + '"]').exists() == false) {
                        html = '';
                        html += '<div name="' + widgetId + '" id="' + widgetId + '" data-widget="' + json.widget + '" data-minvalue="' + json.minValue + '" data-maxvalue="' + json.maxValue + '" class="{class10}" width="{width}" height="{height}"></div> ' + (json.valuedescription?'<span class="text {class11}">' + json.valuedescription + '</span>':'') + '';
                        json.content = html;
                        json.widgetId = widgetId;
                        iotCC.addWidget(json, function() {
                            iotCC.createGauge(widgetId, json);
                        });
                    } else {
                        json.minValue = $('div[name="' + widgetId + '"]').data('minvalue');
                        json.maxValue = $('div[name="' + widgetId + '"]').data('maxvalue');
                        iotCC.createGauge(widgetId, json);
                        iotCC.animate($('div[name="' + widgetId + '"]').closest(".widgetcontainer"));
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
                } else if (widget == 'chart.js') {
                    var chart = $('canvas[name="' + widgetId + '"]').first().data('chart');
                    iotCC.createChart(widgetId, {chart: chart, value: json.value});
                } else if (widget == 'gauge') {
                    var minValue = $('div[name="' + widgetId + '"]').first().data('minvalue');
                    var maxValue = $('div[name="' + widgetId + '"]').first().data('maxvalue');
                    iotCC.createGauge(widgetId, {minValue: minValue, maxValue: maxValue, value: json.value});
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
    addWidget: function(json, callback) {
        if (this.templates[json.template] != undefined) {
            iotCC.addHtml(json, this.templates[json.template]);
            if ($.isFunction(callback)) {
                callback();
            }
        } else {
            // TODO : fetch custom templates over HTTP or html field from custom subscriptions
            $.get('assets/template/' + json.template + '.html', function(html) {
                iotCC.templates[json.template] = html;
                iotCC.addHtml(json, html);
                if ($.isFunction(callback)) {
                    callback();
                }
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
        if ($.isFunction(json.callback)) {
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
            if (iotCC.appConfig.pageContainer) {
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
                if (iotCC.appConfig.pageContainer) {
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
        var config = JSON.parse(localStorage.getItem('iotCCConfig')) || {};
        config.mqttConfig = $('#mqttConfig').serializeObject();
        config.mqttConfig.secure = $('#secure').prop('checked');
        config.mqttConfig.debug = $('#debug').prop('checked');
        config.mqttConfig.simulateDevices = $('#simulateDevices').prop('checked');

        this.mqttConfig = Object.assign(this.mqttConfig, config.mqttConfig);

        try {
            localStorage.setItem('iotCCConfig', JSON.stringify(config));
            iotCC.showNotification('MQTT connection data', 'Data saved succesfully', 'settings-notification1', 'info', 1.5);
        } catch(ex) {
            iotCC.showNotification('MQTT connection data', 'Cannot save data to local storage', 'settings-notification1', 'danger', 3);
        }
        this.clearSession();
    },
    getConfig: function() {
        try {
            var config = JSON.parse(localStorage.getItem('iotCCConfig')) || {};
            this.mqttConfig = Object.assign(this.mqttDefaultConfig, config.mqttConfig);
            for(var key in this.mqttConfig) {
                var value = this.mqttConfig[key];
                if (value == true || value == false) {
                    $('input[name="' + key + '"]').prop("checked", value);
                } else {
                    $('input[name="' + key + '"]').val(value);
                }
            }

            this.appConfig = Object.assign(this.appConfig, config.appConfig);
            for(var key in this.appConfig) {
                var value = this.appConfig[key];
                if (value == true || value == false) {
                    $('input[name="' + key + '"]').prop("checked", value);
                } else {
                    $('input[name="' + key + '"]').val(value);
                }
            }
            $('#iotccconfig').html(localStorage.getItem('iotCCConfig'));
        } catch(ex) {
            console.log (ex);
            return;
        }
        return config;
    },
    showNotification: function(title, content, prepend, type, timer) {
        var html = '<div class="col-md-12 ' + prepend + '-html">';
        html += '<div class="callout callout-' + type + '">';
        html += '<h4>' + title + '</h4>';
        html += '<span>' + content + '</span>';
        html += '</div>';
        html += '</div>';

        if ($('.' + prepend + '-html').exists()) $('.' + prepend + '-html').remove();
        $('.' + prepend).prepend(html);

        if (timer != undefined) {
            setTimeout(function() {
                $('.' + prepend + '-html').remove();
            }, timer * 1000);
        }
    },
    refreshDevices: function() {
        this.mqttClient.publish('/iotcc/device', '{"clientId": "' + this.mqttConfig.clientId + '"}', {qos: 1, retained: false});
    },
    addEvent: function(on, callback) {
        if (!$.isFunction(callback)) return;
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
    parseTemplate: function(json, html, debug) {
        html = html.replace('{content}', json.content);
        delete json['content'];
        for (var key in json) {
            html = html.replace('{' + key + '}', json[key]);
        }
        if (this.appConfig.templateDebug == false && debug == undefined) {
            html = html.replace(/{(\w*)}/g, '');
        }
        return html;
    },
    customSubscriptions: function() {
        var config = JSON.parse(localStorage.getItem('iotCCConfig')) || {};
        $('.subscriptions-table').find('tr').remove();
        for (i in config.customSubscriptions) {
            var subscription = config.customSubscriptions[i];
            var html = '<tr>';
            html += '<td><a href="#" class="btn fa fa-edit"></a><a href="#" class="btn fa fa-remove"></a></td>';
            html += '<td>' + i + '</td>';
            html += '<td>' + subscription.topic + '</td>';
            html += '<td>' + subscription.widget + '</td>';
            html += '<td>' + subscription.widgetJson + '</td>';
            html += '<td>' + subscription.publishTopic + '</td>';
            html += '<td>' + subscription.active + '</td>';
            html += '</tr>';
            $('.subscriptions-table').append(html);
            if (subscription.topic) this.mqttClient.subscribe(subscription.topic, {qos: 1});
        }
        $('.subscriptions-table').find('a.fa-edit').click(function(e){
            e.preventDefault();
            var tr = $(this).parent().parent();
            $('input[name="index"]').val( $(tr).find('td:eq(1)').html() );
            $('input[name="topic"]').val( $(tr).find('td:eq(2)').html() );
            $('select[name="widget"]').val( $(tr).find('td:eq(3)').html() ).trigger('change');
            $('textarea[name="widgetJson"]').val( $(tr).find('td:eq(4)').html() );
            $('input[name="publishTopic"]').val( $(tr).find('td:eq(5)').html() );
            $('input[name="active"]').prop('checked', $(tr).find('td:eq(6)').html()=='true'?true:false);
            $('#widgetJson').trigger('keyup');
        });
        $('.subscriptions-table').find('a.fa-remove').click(function(e) {
            e.preventDefault();
            var tr = $(this).parent().parent();
            var index = $(tr).find('td:eq(1)').html();
            try {
                var config = JSON.parse(localStorage.getItem('iotCCConfig')) || {};
                var data = config.customSubscriptions || [];
                data.splice(index);
                config.customSubscriptions = data;

                localStorage.setItem('iotCCConfig', JSON.stringify(config));
                iotCC.showNotification('Custom subscriptions', 'Data deleted succesfully', 'subscriptions-notification', 'info', 1.5);
                iotCC.customSubscriptions();
            } catch(ex) {
                console.log (ex);
                iotCC.showNotification('Custom subscriptions', 'Cannot save data to local storage', 'subscriptions-notification', 'danger', 3);
            }
        });
    },
    handleCustomSubscriptions: function(topic, message) {
        message = message.toString();
        var config = JSON.parse(localStorage.getItem('iotCCConfig')) || {};
        for (i in config.customSubscriptions) {
            var subscription = config.customSubscriptions[i];
            if (topic == subscription.topic) {
                widgetJson = JSON.parse(subscription.widgetJson);
                widgetJson.publishTopic = subscription.publishTopic;
                if (subscription.widget == 'toggle') {
                    if (parseInt(message) > 0) {
                        widgetJson.checked = true;
                    } else {
                        widgetJson.checked = false;
                    }
                } else if (subscription.widget == 'radios') {
                    for(i in widgetJson.options) {
                        if (widgetJson.options[i].status == message) {
                            widgetJson.options[i].checked = true;
                        } else {
                            widgetJson.options[i].checked = false;
                        }
                    }
                } else if (subscription.widget == 'data' || subscription.widget == 'data-control') {
                    widgetJson.value = message.toString();
                }
                widgetJson = JSON.stringify(widgetJson);
                iotCC.mqttClient.publish('/iotcc/customSubscription/' + i + '/config', widgetJson, {qos: 1, retained: false});
            }
        }
    },
    createChart: function(id, json) {
        if (this.charts[id]) {
            this.charts[id].destroy();
        }
        var pieChartCanvas = $('canvas[name="' + id + '"]').get(0).getContext("2d");
        this.charts[id] = new Chart(pieChartCanvas, {
            type: json.chart,
            data: json.value,
            options: {
                responsive: true,
                maintainAspectRatio: true
            }
        });
    },
    createGauge: function(id, json) {
        if (this.gauges[id]) {
            this.gauges[id].destroy();
        }
        this.gauges[id] = new JustGage({
            id: id,
            value: json.value,
            min: json.minValue || 0,
            max: json.maxValue || 100,
            label: json.valuedescription || '',
            symbol: json.symbol || '',
            levelColors: json.invertColors ? ["#ff0000", "#f9c802", "#a9d70b"] : ["#a9d70b", "#f9c802", "#ff0000"]
        });
    },
    clearSession: function() {
        iotCC.mqttClient.end();
        $('div.pagecontainer').remove();
        $('div.pagination').addClass('hide').find('label').each(function(k,v){
            if ($(this).data('pagination') > 0) {
                $(this).remove();
            }
        });
        this.init();
    }
}

jQuery.fn.exists = function(){return ($(this).length > 0);}
$(document).ready(function() {

    $('.navigation').click(function(e) {
        e.preventDefault();
        var section = $(this).data('section');
        $('.navigation').parent().removeClass('active');
        $(this).parent().addClass('active');
        $('section.content,section.content-header').addClass('hide');
        $('section.content,section.content-header').filter('[data-section="' + section + '"]').removeClass('hide');
        if (!$('body').hasClass('sidebar-collapse')) {
            $('.sidebar-toggle').trigger('click');
        }
    });

    $('label').filter('[data-pagination="0"]').click(function(e){
        if (iotCC.appConfig.pageContainer) {
            $('div.pagecontainer').removeClass('hide');
        } else {
            $('div.page').removeClass('hide');
        }
    });

    $('#saveMqttConfig').click(function(e) {
        e.preventDefault();
        iotCC.saveConfig();
    });

    $('#saveAppConfig').click(function(e) {
        e.preventDefault();
        var config = JSON.parse(localStorage.getItem('iotCCConfig'));
        config.appConfig = $('#appConfig').serializeObject();
        config.appConfig.pageContainer = $('#pageContainer').prop('checked');
        config.appConfig.templateDebug = $('#templateDebug').prop('checked');

        try {
            localStorage.setItem('iotCCConfig', JSON.stringify(config));
            iotCC.showNotification('Options', 'Data saved succesfully', 'settings-notification2', 'info', 1.5);
        } catch(ex) {
            iotCC.showNotification('Options', 'Cannot save data to local storage', 'settings-notification2', 'danger', 3);
        }
        iotCC.clearSession();
    });

    $('a').filter('[data-toggle="control-refresh"]').click(function(e) {
        e.preventDefault();
        iotCC.refreshDevices();
    });

    $('a').filter('[data-toggle="control-console"]').click(function(e) {
        e.preventDefault();
        if ($('#mqttConsole').hasClass('hide')) {
            $('#mqttConsole').removeClass('hide')
        } else {
            $('#mqttConsole').addClass('hide');
        }
    });

    $('#widget').change(function(e) {
        e.preventDefault();
        var widgetJson = iotCC.customSubscriptionWidgetJson[$(this).val()];
        $('.help-block.widgetJson').html('Example JSON Options: ' + widgetJson).click(function(e){
            e.preventDefault();
            $('.subscriptionWidgetJson-html').remove();
            $('#widgetJson').val(JSON.stringify(JSON.parse(widgetJson), null, 4)).trigger('keyup');
        });

        if ($(this).find('option:selected').data('action') == 'on') {
            $('.subscriptionAction').removeClass('hide');
        } else {
            $('.subscriptionAction').addClass('hide');
        }
    });

    $('#widgetJson').keyup(function() {
        $('.subscriptionWidgetJson-html').remove();
        var val = $('#widgetJson').val();
        if (val) {
            try { json = JSON.parse(val); }
            catch (e) {
                iotCC.showNotification('JSON Error', 'Error in parsing json. ' + e, 'subscriptionWidgetJson', 'danger');
                return;
            }
        } else {
            return;
        }
        if (json.template) {
            $.ajaxSetup({ cache: false });
            $.get('assets/template/' + json.template + '.html', function(html) {
                html = iotCC.parseTemplate(json, html, true);
                $('.box-body.widget-preview').html(html);
                var template = $('.box-body.widget-preview').find('.widgetcontainer').html();
                $('.box-body.widget-preview').find('.widgetcontainer').replaceWith(template);
                $('#widgetCodePreview').val(template.trim());
            });
        }
    });

    $('button.beautify').click(function() {
        var val = $('#widgetJson').val();
        if (val) {
            try { json = JSON.parse(val); }
            catch (e) {
                return;
            }
        } else {
            return;
        }
        $('#widgetJson').val(JSON.stringify(json, null, 4));
    });


    $('#saveSubscription').click(function(e) {
        e.preventDefault();
        var form = $('#customSubscriptions').serializeObject();
        form.active = $('#active').prop('checked');
        try {
            var config = JSON.parse(localStorage.getItem('iotCCConfig')) || {};
            var data = config.customSubscriptions || [];
            if (form.index) {
                data[form.index] = form;
            } else {
                data.push(form);
            }
            config.customSubscriptions = data;

            localStorage.setItem('iotCCConfig', JSON.stringify(config));
            iotCC.showNotification('Custom subscriptions', 'Data saved succesfully', 'subscriptions-notification', 'info', 1.5);
            iotCC.customSubscriptions();
            $('#customSubscriptions')[0].reset();
            $('.help-block.widgetJson').html('');
        } catch(ex) {
            console.log (ex);
            iotCC.showNotification('Custom subscriptions', 'Cannot save data to local storage', 'subscriptions-notification', 'danger', 3);
        }
        iotCC.clearSession();
    });

    $('#saveIoTCCConfig').click(function(e) {
        e.preventDefault();
        var config = $('#iotccconfig').val();
        try {
            JSON.parse(config);
            localStorage.setItem('iotCCConfig', config);
            iotCC.showNotification('IoTCC Config', 'Data saved succesfully', 'settings-notification3', 'info', 1.5);
        } catch(ex) {
            console.log (ex);
            iotCC.showNotification('IoTCC Config', 'Cannot save data to local storage', 'settings-notification3', 'danger', 3);
        }
        iotCC.clearSession();
    });

    $('#mqttConsoleSend').click(function(e) {
        e.preventDefault();
        iotCC.mqttClient.publish($('#mqttConsoleTopic').val(), $('#mqttConsoleMessage').val(), {qos: 1, retained: false});
        if (iotCC.mqttConfig.debug) {
            logger.log('Console Publish Topic:= ' + $('#mqttConsoleTopic').val() + '\n\tMessage:= ' + $('#mqttConsoleMessage').val());
        }
    });

    if (window.location.hash) {
        var section = window.location.hash.replace("#", "");
        $('a.navigation').filter('[data-section="' + section + '"]').trigger('click');
    }

    iotCC.init();
});

// custom console
logger = new Object();
logger.log = function(log) {
    $('.console').prepend(log + '<br />');
};
