# IoT Control Center

IoT JSON comunication protocol via MQTT broker.

In november 2016 I wanted to remote control and automate some tasks like watering my greenhouse, turn off/on lights/heating on a country house.

I was playing with Arduino/ESP8266/Raspberry Pi for some time now and I started thinking and researching a way to do it. After a few days I decided to use a combination of Raspberry Pi as a server with a MQTT broker and NodeMCU.

I had in mind a JSON based protocol for communication via MQTT. Then I searched the net to see it this was done before and I found IoT Manager. I tried it for a few days for night heating my two dogs.
I had a few problems with it and decided to build my own control center with ideas like :
- web compatibile. I wanted to be able to use it in a browser
- TODO: build for it an Electron shell
- TODO: iOS and Android progressive web apps
- use an opensource interface. I tried a few, but I decided to use AdminLTE with OnsenUI components
- templatable widgets
- TODO:anyone to be able to use external CSS/JS/templates/images for widgets
- all open control interfaces to show the same data/statuses without the need for refresh
- TODO: create `scenarios` based on IoT data. if sensor1Temp < 10 then turn on heat
- TODO: use NodeRed to create scenarios/notifications

How it works (WIP) :
IoT CC subscribes to
- /iotcc/+/+/config
- /iotcc/+/+/data
- /iotcc/+/device

IoT CC publishes to
- /iotcc/device - {"clientId": "{clientId}"}

IoT devices subscribe to
- /iotcc/+/+/data
- /iotcc/device

IoT devices publish to :
- /iotcc/+/device - {"name":"House heating 1","desc":"", "pages" : [{"pageId" : 10, "pageName" : "House heating", "icon": "ion-ios-home"}]}
- /iotcc/+/+/config - {"pageName": "House heating", "pageId": 10, "widget":"radios", "title":"Hollway Heater", "topic":"/iotcc/heater1/heater", "options":[{"checked":true, "label": "Off", "status":"1"}, {"label": "Confort", "status":"2"}, {"label": "Anti freeze", "status":"3"}, {"label": "Confort -2", "status":"4"}], "template": "template-3", "icon": "ion-ios-home", "bgcolor": "bg-blue", "order": 40}
- /iotcc/+/+/data - {"status":"{status}"}

### Desktop interface (WIP)
![Alt text](/screenshots/desktop.png?raw=true "Desktop interface")

### Mobile interface (WIP)
![Alt text](/screenshots/mobile.png?raw=true "Mobile interface")
