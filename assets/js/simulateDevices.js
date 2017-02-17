iotCC.addEvent('connect', function() {
    if (iotCC.mqttConfig.simulateDevices == false) {
        return;
    }
    iotCC.mqttClient.subscribe('/iotcc/device', {qos: 1});
});

iotCC.addEvent('message', function(json, widgetId, topic, topicPath) {
    if (iotCC.mqttConfig.simulateDevices == false) {
        return;
    }
    if (topicPath[2] == 'device') {

        iotCC.mqttClient.publish('/iotcc/heater1/device', '{"name":"House heating 1","desc":"", "pages" : [{"pageId": 10, "pageName": "House heating", "icon": "ion-ios-home", "class1":"bg-blue", "order": "10"}]}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/heater1/heater/config', '{"pageName": "House heating", "pageId": 10, "widget":"radios", "title":"Hollway Heater", "topic":"/iotcc/heater1/heater", "options":[{"checked":true, "label": "Off", "status":"1"}, {"label": "Confort", "status":"2"}, {"label": "Anti freeze", "status":"3"}, {"label": "Confort -2", "status":"4"}], "template": "template-1", "icon": "ion-ios-home", "class4": "bg-blue", "order": 40}', {qos: 1, retained: false});

        iotCC.mqttClient.publish('/iotcc/heater2/device', '{"name":"House heating 2","desc":"", "pages" : [{"pageId": 10, "pageName": "House heating", "icon": "ion-ios-home", "class1":"bg-blue", "order": "10"}]}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/heater2/heater/config', '{"pageName": "House heating", "pageId": 10, "widget":"radios", "title":"Kitchen Heater", "topic":"/iotcc/heater2/heater", "options":[{"checked":true, "label": "Off", "status":"1"}, {"label": "Confort", "status":"2"}, {"label": "Anti freeze", "status":"3"}, {"label": "Confort -2", "status":"4"}], "template": "template-1", "icon": "ion-ios-home", "class4": "bg-blue", "order": 30}', {qos: 1, retained: false});

        iotCC.mqttClient.publish('/iotcc/heater3/device', '{"name":"House heating 3","desc":"", "pages" : [{"pageId" : 10, "pageName" : "House heating", "icon": "ion-ios-home", "class1":"bg-blue", "order": "10"}]}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/heater3/heater/config', '{"pageName": "House heating", "pageId": 10, "widget":"radios", "title":"Bedroom Heater", "topic":"/iotcc/heater3/heater", "options":[{"checked":true, "label": "Off", "status":"1"}, {"label": "Confort", "status":"2"}, {"label": "Anti freeze", "status":"3"}, {"label": "Confort -2", "status":"4"}], "template": "template-1", "icon": "ion-ios-home", "class4": "bg-blue", "order": 10}', {qos: 1, retained: false});

        iotCC.mqttClient.publish('/iotcc/heater4/device', '{"name":"House heating 4","desc":"", "pages" : [{"pageId" : 10, "pageName" : "House heating", "icon": "ion-ios-home", "class1":"bg-blue", "order": "10"}]}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/heater4/heater/config', '{"pageName": "House heating", "pageId": 10, "widget":"radios", "title":"Living Heater", "topic":"/iotcc/heater4/heater", "options":[{"checked":true, "label": "Off", "status":"1"}, {"label": "Confort", "status":"2"}, {"label": "Anti freeze", "status":"3"}, {"label": "Confort -2", "status":"4"}], "template": "template-1", "icon": "ion-ios-home", "class4": "bg-blue", "order": 20}', {qos: 1, retained: false});

        iotCC.mqttClient.publish('/iotcc/dogsheating/device', '{"name":"Dogs heating","desc":"", "pages" : [{"pageId" : 20, "pageName" : "Dogs heating", "icon": "ion-ios-paw", "class1":"bg-green", "order": "40"}]}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/dogsheating/toggle1/config', '{"pageName": "Dogs heating", "pageId": 20, "widget":"toggle", "title":"Mara", "topic":"/iotcc/dogsheating/toggle1", "checked":true, "template": "template-1", "icon": "ion-ios-paw", "class4": "bg-green", "order" : 10}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/dogsheating/toggle2/config', '{"pageName": "Dogs Heating", "pageId": 20, "widget":"toggle", "title":"Linda", "topic":"/iotcc/dogsheating/toggle2", "template": "template-1", "icon": "ion-ios-paw", "class4": "bg-green", "order" : 20}', {qos: 1, retained: false});

        iotCC.mqttClient.publish('/iotcc/outdoorlights1/device', '{"name":"Outdoor lighting 1","desc":"", "pages" : [{"pageId" : 30, "pageName" : "Outdoor Lights", "icon": "ion-ios-home", "class1":"bg-orange", "order": "20"}]}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/outdoorlights1/garage/config', '{"pageName": "Outdoor lightling", "pageId": 30, "widget":"toggle", "title":"Garage", "topic":"/iotcc/outdoorlights1/garage", "checked":true, "template": "template-1", "icon": "ion-model-s", "class4": "bg-orange", "order": 40}', {qos: 1, retained: false});

        iotCC.mqttClient.publish('/iotcc/outdoorlights2/device', '{"name":"Outdoor lighting 2","desc":"", "pages" : [{"pageId" : 30, "pageName" : "Outdoor Lights", "icon": "ion-ios-home", "class1":"bg-green", "order": "20"}]}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/outdoorlights2/house1/config', '{"pageName": "Outdoor lightling", "pageId": 30, "widget":"toggle", "title":"House front", "topic":"/iotcc/outdoorlights2/house1", "template": "template-1", "icon": "ion-ios-home", "class4": "bg-orange", "order": 10}', {qos: 1, retained: false});

        iotCC.mqttClient.publish('/iotcc/outdoorlights3/device', '{"name":"Outdoor lighting 3","desc":"", "pages" : [{"pageId" : 30, "pageName" : "Outdoor Lights", "icon": "ion-ios-home", "class1":"bg-green", "order": "20"}]}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/outdoorlights3/house2/config', '{"pageName": "Outdoor lightling", "pageId": 30, "widget":"toggle", "title":"House back", "topic":"/iotcc/outdoorlights3/house2", "template": "template-1", "icon": "ion-ios-home", "class4": "bg-orange", "order": 20}', {qos: 1, retained: false});

        iotCC.mqttClient.publish('/iotcc/outdoorlights4/device', '{"name":"Outdoor lighting 4","desc":"", "pages" : [{"pageId" : 30, "pageName" : "Outdoor Lights", "icon": "ion-ios-home", "class1":"bg-green", "order": "20"}]}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/outdoorlights4/house3/config', '{"pageName": "Outdoor lightling", "pageId": 30, "widget":"toggle", "title":"House sides", "topic":"/iotcc/outdoorlights4/house3", "template": "template-1", "icon": "ion-ios-home", "class4": "bg-orange", "order": 30}', {qos: 1, retained: false});

        iotCC.mqttClient.publish('/iotcc/greenhouse/device', '{"name":"Greenhouse","desc":"", "pages" : [{"pageId" : 40, "pageName" : "Greenhouse", "icon": "ion-ios-home", "class1":"bg-green", "order": "30"}]}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/greenhouse/tempsensor1/config', '{"pageName": "Greenhouse", "pageId": 40, "widget":"data", "format":"int", "title":"Temp sensor 1", "topic":"/iotcc/greenhouse/tempsensor1", "value": "22", "valuedescription": "degrees C", "template": "template-3", "icon": "ion-ios-home", "class": "bg-green", "order": 30}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/greenhouse/tempsensor1/data', '{"value":"' + (Math.floor(Math.random() * (10)) + 20) + '"}');
        iotCC.mqttClient.publish('/iotcc/greenhouse/heater/config', '{"pageName": "Greenhouse", "pageId": 40, "widget":"data-control", "format":"int", "title":"Heater", "topic":"/iotcc/greenhouse/heater", "value": "22", "valuedescription": "degrees C", "template": "template-3", "icon": "ion-ios-home", "class": "bg-green", "class2": "text-center", "class10": "xs", "order": 30}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/greenhouse/heater/data', '{"value":"' + (Math.floor(Math.random() * (10)) + 20) + '"}');

        iotCC.mqttClient.publish('/iotcc/charts/device', '{"name":"Charts","desc":"", "pages" : [{"pageId" : 1000, "pageName" : "Charts", "icon": "ion-ios-home", "class1":"bg-yellow", "order": "100"}]}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/charts/pie/config', '{"pageName": "Charts", "pageId": 1000, "widget": "chart.js", "chart": "pie", "title": "Pie chart", "topic":"/iotcc/charts/pie", "value": {"labels": ["Water", "Air"], "datasets": [{"data": [70, 30], "backgroundColor": ["#3c8dbc", "#fff"], "hoverBackgroundColor": [ "#3c8dbc", "#fff"]}]}, "template": "template-3", "icon": "fa fa-pie-chart", "class": "bg-yellow", "order": 30}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/charts/doughnut/config', '{"pageName": "Charts", "pageId": 1000, "widget": "chart.js", "chart": "doughnut", "title": "Doughnut chart", "topic":"/iotcc/charts/doughnut", "value": {"labels": ["Water", "Air"], "datasets": [{"data": [70, 30], "backgroundColor": ["#3c8dbc", "#fff"]}]}, "template": "template-3", "icon": "fa fa-pie-chart", "class": "bg-yellow", "order": 30}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/charts/bar/config', '{"pageName": "Charts", "pageId": 1000, "widget": "chart.js", "chart": "bar", "title": "Bar chart", "topic":"/iotcc/charts/bar", "value": {"labels": ["Water", "Air"], "datasets": [{"label": "Bar chart", "data": [70, 30], "backgroundColor": ["#3c8dbc", "#fff"]}]}, "template": "template-3", "icon": "fa fa-pie-chart", "class": "bg-yellow", "order": 30}', {qos: 1, retained: false});

        iotCC.mqttClient.publish('/iotcc/gauges/device', '{"name":"Gauges","desc":"", "pages" : [{"pageId" : 2000, "pageName" : "Gauges", "icon": "ion-ios-home", "class1":"bg-green", "order": "100"}]}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/gauges/thermometer/config', '{"pageName": "Gauges", "pageId": 2000, "widget": "gauge", "title": "Thermometer", "topic":"/iotcc/gauges/thermometer", "value": 10, "minValue": -20, "maxValue": 50, "symbol": " C", "template": "template-3", "icon": "fa fa-thermometer-half", "class": "bg-green", "order": 10}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/gauges/hygrometer/config', '{"pageName": "Gauges", "pageId": 2000, "widget": "gauge", "title": "Humidity", "topic":"/iotcc/gauges/hygrometer", "value": 60, "minValue": 0, "maxValue": 100, "symbol": "%", "template": "template-3", "icon": "ion-thermometer", "class": "bg-green", "order": 20}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/gauges/waterlevel/config', '{"pageName": "Gauges", "pageId": 2000, "widget": "gauge", "title": "Water level", "topic":"/iotcc/gauges/waterlevel", "value": 100, "minValue": 0, "maxValue": 2000, "symbol": " L", "invertColors": true, "template": "template-3", "icon": "ion-waterdrop", "class": "bg-green", "order": 30}', {qos: 1, retained: false});
    }
});