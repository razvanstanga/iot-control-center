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
        iotCC.mqttClient.publish('/iotcc/heater1/device', '{"name":"House heating 1","desc":"", "pages" : [{"pageId" : 10, "pageName" : "House heating", "icon": "ion-ios-home"}]}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/heater1/heater/config', '{"id":"100", "pageName": "House heating", "pageId": 10, "widget":"radios", "title":"Hollway Heater", "topic":"/iotcc/heater1/heater", "options":[{"checked":true, "label": "Off", "status":"1"}, {"label": "Confort", "status":"2"}, {"label": "Anti freeze", "status":"3"}, {"label": "Confort -2", "status":"4"}], "template": "template-3", "icon": "ion-ios-home", "bgcolor": "bg-blue", "order": 40}', {qos: 1, retained: false});

        iotCC.mqttClient.publish('/iotcc/heater2/device', '{"name":"House heating 2","desc":"", "pages" : [{"pageId" : 10, "pageName" : "House heating", "icon": "ion-ios-home"}]}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/heater2/heater/config', '{"id":"101", "pageName": "House heating", "pageId": 10, "widget":"radios", "title":"Kitchen Heater", "topic":"/iotcc/heater2/heater", "options":[{"checked":true, "label": "Off", "status":"1"}, {"label": "Confort", "status":"2"}, {"label": "Anti freeze", "status":"3"}, {"label": "Confort -2", "status":"4"}], "template": "template-3", "icon": "ion-ios-home", "bgcolor": "bg-blue", "order": 30}', {qos: 1, retained: false});

        iotCC.mqttClient.publish('/iotcc/heater3/device', '{"name":"House heating 3","desc":"", "pages" : [{"pageId" : 10, "pageName" : "House heating", "icon": "ion-ios-home"}]}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/heater3/heater/config', '{"id":"102", "pageName": "House heating", "pageId": 10, "widget":"radios", "title":"Bedroom Heater", "topic":"/iotcc/heater3/heater", "options":[{"checked":true, "label": "Off", "status":"1"}, {"label": "Confort", "status":"2"}, {"label": "Anti freeze", "status":"3"}, {"label": "Confort -2", "status":"4"}], "template": "template-3", "icon": "ion-ios-home", "bgcolor": "bg-blue", "order": 10}', {qos: 1, retained: false});

        iotCC.mqttClient.publish('/iotcc/heater4/device', '{"name":"House heating 4","desc":"", "pages" : [{"pageId" : 10, "pageName" : "House heating", "icon": "ion-ios-home"}]}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/heater4/heater/config', '{"id":"103", "pageName": "House heating", "pageId": 10, "widget":"radios", "title":"Living Heater", "topic":"/iotcc/heater4/heater", "options":[{"checked":true, "label": "Off", "status":"1"}, {"label": "Confort", "status":"2"}, {"label": "Anti freeze", "status":"3"}, {"label": "Confort -2", "status":"4"}], "template": "template-3", "icon": "ion-ios-home", "bgcolor": "bg-blue", "order": 20}', {qos: 1, retained: false});

        iotCC.mqttClient.publish('/iotcc/dogsheating/device', '{"name":"Dogs heating","desc":"", "pages" : [{"pageId" : 20, "pageName" : "Dogs heating", "icon": "ion-ios-paw"}]}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/dogsheating/toggle1/config', '{"id":"200", "pageName": "Dogs heating", "pageId": 20, "widget":"toggle", "title":"Mara", "topic":"/iotcc/dogsheating/toggle1", "checked":true, "template": "template-1", "icon": "ion-ios-paw", "bgcolor": "bg-green", "order" : 10}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/dogsheating/toggle2/config', '{"id":"201", "pageName": "Dogs Heating", "pageId": 20, "widget":"toggle", "title":"Linda", "topic":"/iotcc/dogsheating/toggle2", "template": "template-1", "icon": "ion-ios-paw", "bgcolor": "bg-green", "order" : 20}', {qos: 1, retained: false});

        iotCC.mqttClient.publish('/iotcc/outdoorlights1/device', '{"name":"Outdoor lighting 1","desc":"", "pages" : [{"pageId" : 30, "pageName" : "Outdoor Lights", "icon": "ion-ios-home"}]}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/outdoorlights1/garage/config', '{"id":"300", "pageName": "Outdoor lightling", "pageId": 30, "widget":"toggle", "title":"Garage", "topic":"/iotcc/outdoorlights/garage", "checked":true, "template": "template-1", "icon": "ion-model-s", "bgcolor": "bg-orange", "order": 40}', {qos: 1, retained: false});

        iotCC.mqttClient.publish('/iotcc/outdoorlights2/device', '{"name":"Outdoor lighting 2","desc":"", "pages" : [{"pageId" : 30, "pageName" : "Outdoor Lights", "icon": "ion-ios-home"}]}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/outdoorlights2/house1/config', '{"id":"301", "pageName": "Outdoor lightling", "pageId": 30, "widget":"toggle", "title":"House front", "topic":"/iotcc/outdoorlights/house1", "template": "template-1", "icon": "ion-ios-home", "bgcolor": "bg-orange", "order": 10}', {qos: 1, retained: false});

        iotCC.mqttClient.publish('/iotcc/outdoorlights3/device', '{"name":"Outdoor lighting 3","desc":"", "pages" : [{"pageId" : 30, "pageName" : "Outdoor Lights", "icon": "ion-ios-home"}]}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/outdoorlights3/house2/config', '{"id":"302", "pageName": "Outdoor lightling", "pageId": 30, "widget":"toggle", "title":"House back", "topic":"/iotcc/outdoorlights/house2", "template": "template-1", "icon": "ion-ios-home", "bgcolor": "bg-orange", "order": 20}', {qos: 1, retained: false});

        iotCC.mqttClient.publish('/iotcc/outdoorlights4/device', '{"name":"Outdoor lighting 4","desc":"", "pages" : [{"pageId" : 30, "pageName" : "Outdoor Lights", "icon": "ion-ios-home"}]}', {qos: 1, retained: false});
        iotCC.mqttClient.publish('/iotcc/outdoorlights4/house3/config', '{"id":"302", "pageName": "Outdoor lightling", "pageId": 30, "widget":"toggle", "title":"House sides", "topic":"/iotcc/outdoorlights/house3", "template": "template-1", "icon": "ion-ios-home", "bgcolor": "bg-orange", "order": 30}', {qos: 1, retained: false});
    }
});