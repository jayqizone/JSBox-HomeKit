const FILE = 'data.json';
const config = $file.exists(FILE) && JSON.parse($file.read(FILE).string) || [];

$ui.render({
    props: {
        id: 'mainView',
        title: 'HomeKit',
        navBarHidden: $app.env === $env.today,
        bgcolor: $color('clear')
    },
    views: [{
        type: 'list',
        props: {
            id: 'deviceList',
            bgcolor: $color('clear'),
            reorder: $app.env !== $env.today,
            actions: [{
                title: 'delete',
                handler: (sender, indexPath) => {
                    saveWorkspace();
                }
            }],
            template: {
                views: [{
                    type: 'label',
                    props: {
                        id: 'title',
                        align: $align.center
                    },
                    layout: function (make) {
                        make.left.right.equalTo(0);
                        make.top.inset(5);
                    }
                }, {
                    type: 'label',
                    props: {
                        id: 'subTitle',
                        align: $align.center,
                        font: $font(10)
                    },
                    layout: function (make) {
                        make.left.right.equalTo(0);
                        make.bottom.inset(5);
                    }
                }]
            },
            data: [],
        },
        layout: $layout.fill,
        events: {
            didSelect: function (sender, indexPath, data) {
                let completionHandler = $block('void, NSError *', function (error) {
                    error && console.log(error.rawValue().localizedDescription);
                });
                if (data.type === 'accessory') {
                    let accessory = hv.$accessoryWithUUID(data.uuid);
                    if (accessory.$isReachable()) {
                        for (let service of accessory.$services().rawValue().map(el => el.runtimeValue())) {
                            if (service.$serviceType().rawValue() === data.serviceType) {
                                for (let characteristic of service.$characteristics().rawValue().map(el => el.runtimeValue())) {
                                    if (characteristic.$characteristicType().rawValue() === data.characteristicType) {
                                        characteristic.$writeValue_completionHandler(1 - characteristic.$value(), completionHandler);
                                    }
                                }
                            }
                        }
                    } else {
                        $ui.error('Accessory Not Reachable');
                    }
                } else if (data.type === 'actionSet') {
                    let actionSet = hv.$actionSetWithUUID(data.uuid);
                    actionSet.$home().$executeActionSet_completionHandler(actionSet, completionHandler);
                }
            },
            reorderFinished: function (data) {
                saveWorkspace();
            }
        }
    }]
});

if ($app.env !== $env.today) {
    $('mainView').add({
        type: "button",
        props: {
            title: 'Add'
        },
        layout: function (make, view) {
            make.left.right.inset(8);
            make.bottom.inset(8);
            make.height.equalTo(36);
        },
        events: {
            tapped: function () {
                $ui.push({
                    props: {
                        title: 'Add',
                        bgcolor: $color('clear')
                    },
                    views: [{
                        type: 'list',
                        props: {
                            id: 'homeList',
                            bgcolor: $color('clear'),
                            template: {
                                views: [{
                                    type: 'label',
                                    props: {
                                        id: 'title',
                                        align: $align.center
                                    },
                                    layout: function (make) {
                                        make.left.right.equalTo(0);
                                        make.top.inset(5);
                                    }
                                }, {
                                    type: 'label',
                                    props: {
                                        id: 'subTitle',
                                        align: $align.center,
                                        font: $font(10)
                                    },
                                    layout: function (make) {
                                        make.left.right.equalTo(0);
                                        make.bottom.inset(5);
                                    }
                                }]
                            },
                            data: [],
                        },
                        layout: $layout.fill,
                        events: {
                            didSelect: function (sender, indexPath, deviceData) {
                                if (deviceData.type === 'accessory') {
                                    $ui.push({
                                        props: {
                                            bgcolor: $color('clear')
                                        },
                                        views: [{
                                            type: 'list',
                                            props: {
                                                id: 'serviceList',
                                                bgcolor: $color('clear'),
                                                template: {
                                                    views: [{
                                                        type: 'label',
                                                        props: {
                                                            id: 'title',
                                                            align: $align.center
                                                        },
                                                        layout: $layout.fill
                                                    }]
                                                },
                                                data: [],
                                            },
                                            layout: $layout.fill,
                                            events: {
                                                didSelect: async function (sender, indexPath, serviceData) {
                                                    $ui.push({
                                                        props: {
                                                            navBarHidden: $app.env === $env.today,
                                                            bgcolor: $color('clear')
                                                        },
                                                        views: [{
                                                            type: 'list',
                                                            props: {
                                                                id: 'characteristicList',
                                                                bgcolor: $color('clear'),
                                                                template: {
                                                                    views: [{
                                                                        type: 'label',
                                                                        props: {
                                                                            id: 'title',
                                                                            align: $align.center
                                                                        },
                                                                        layout: $layout.fill
                                                                    }]
                                                                },
                                                                data: [],
                                                            },
                                                            layout: $layout.fill,
                                                            events: {
                                                                didSelect: async function (sender, indexPath, characteristicData) {
                                                                    $('deviceList').insert({
                                                                        index: $('deviceList').data[0].rows.length,
                                                                        value: {
                                                                            title: deviceData.title,
                                                                            uuid: deviceData.uuid, type: deviceData.type,
                                                                            serviceType: serviceData.type,
                                                                            characteristicType: characteristicData.type,
                                                                            name: deviceData.name,
                                                                            roomName: deviceData.roomName
                                                                        }
                                                                    });
                                                                    saveWorkspace();
                                                                    $('deviceList').runtimeValue().$viewController().$navigationController().$popToRootViewControllerAnimated(true);
                                                                    $ui.toast(deviceData.title.text);
                                                                }
                                                            }
                                                        }]
                                                    });

                                                    let characteristicListData = [{ rows: [] }];
                                                    for (let characteristic of serviceData.service.$characteristics().rawValue().map(el => el.runtimeValue())) {
                                                        characteristicListData[0].rows.push({
                                                            title: {
                                                                text: characteristic.$localizedDescription().rawValue()
                                                            },
                                                            uuid: characteristic.$uniqueIdentifier().$UUIDString().rawValue(),
                                                            type: characteristic.$characteristicType().rawValue(),
                                                        });
                                                    }
                                                    $('characteristicList').data = characteristicListData;
                                                }
                                            }
                                        }]
                                    });

                                    let serviceListData = [{ rows: [] }];
                                    for (let service of deviceData.accessory.$services().rawValue().map(el => el.runtimeValue())) {
                                        serviceListData[0].rows.push({
                                            title: {
                                                text: service.$localizedDescription().rawValue()
                                            },
                                            uuid: service.$uniqueIdentifier().$UUIDString().rawValue(),
                                            type: service.$serviceType().rawValue(),
                                            service: service
                                        });
                                    }
                                    $('serviceList').data = serviceListData;
                                } else if (deviceData.type === 'actionSet') {
                                    $('deviceList').insert({
                                        index: $('deviceList').data[0].rows.length,
                                        value: { title: deviceData.title, uuid: deviceData.uuid, type: deviceData.type, name: deviceData.name }
                                    });
                                    saveWorkspace();
                                    $ui.pop();
                                    $ui.toast(deviceData.title.text);
                                }
                            },
                            didLongPress: function (sender, indexPath, data) {

                            }
                        }
                    }]
                });

                let data = [{ title: 'ActionSet', rows: [] }, { title: 'Accessory', rows: [] }];
                for (let home of hv.$homes().rawValue().map(el => el.runtimeValue())) {
                    for (let actionSet of home.$actionSets().rawValue().map(el => el.runtimeValue())) {
                        data[0].rows.push({
                            title: {
                                text: actionSet.$name().rawValue()
                            },
                            subTitle: {
                                text: ''
                            },
                            uuid: actionSet.$uniqueIdentifier().$UUIDString().rawValue(),
                            type: 'actionSet',
                            name: actionSet.$name().rawValue()
                        });
                    }
                    for (let accessory of home.$accessories().rawValue().map(el => el.runtimeValue())) {
                        data[1].rows.push({
                            title: {
                                text: accessory.$name().rawValue()
                            },
                            subTitle: {
                                text: accessory.$room().$name().rawValue()
                            },
                            uuid: accessory.$uniqueIdentifier().$UUIDString().rawValue(),
                            type: 'accessory',
                            accessory: accessory,
                            name: accessory.$name().rawValue(),
                            roomName: accessory.$room().$name().rawValue()
                        });
                    }
                }
                $('homeList').data = data;
            }
        }
    });
}

let data = [{ rows: [] }];
config.forEach(el => {
    data[0].rows.push({
        ...el,
        title: {
            text: el.name
        },
        subTitle: {
            text: el.roomName || ''
        }
    });
});
$('deviceList').data = data;

$define({
    type: 'HomeManager: HMHomeManager <HMHomeManagerDelegate>',
    events: {
        init: function () {
            self = self.$super().$init();
            self.$setDelegate(self);
            return self;
        },
        homeManagerDidUpdateHomes: function (manager) {
            let data = [{ rows: [] }];
            let update = false;
            let refresh = false;

            config.forEach(el => {
                let device;

                if (el.type === 'accessory') {
                    device = self.$accessoryWithUUID(el.uuid);
                    if (!device) {
                        device = self.$accessoryWithName(el.name, el.roomName);
                    }
                } else {
                    device = self.$actionSetWithUUID(el.uuid);
                    if (!device) {
                        device = self.$actionSetWithName(el.name);
                    }
                }

                if (device) {
                    let uuid = device.$uniqueIdentifier().$UUIDString().rawValue();
                    let name = device.$name().rawValue();

                    if (el.uuid !== uuid) {
                        el.uuid = uuid;
                        update = true;
                        refresh = true;
                    }
                    if (el.name !== name) {
                        el.name = name;
                        update = true;
                        refresh = true;
                    }
                    if (el.roomName) {
                        let roomName = device.$room().$name().rawValue()
                        if (el.roomName !== roomName) {
                            el.roomName = roomName;
                            update = true;
                            refresh = true;
                        }
                    }
                } else {
                    refresh = true;
                }

                data[0].rows.push({
                    ...el,
                    title: {
                        text: device ? el.name : 'Not Found'
                    },
                    subTitle: {
                        text: device ? el.roomName || '' : 'Not Found'
                    },
                });
            });

            if (refresh) {
                $('deviceList').data = data;
            }
            if (update) {
                saveWorkspace();
            }
        },
        accessoryWithUUID: function (uuid) {
            for (let home of self.$homes().rawValue().map(el => el.runtimeValue())) {
                for (let accessory of home.$accessories().rawValue().map(el => el.runtimeValue())) {
                    if (accessory.$uniqueIdentifier().$UUIDString().rawValue() === uuid) {
                        return accessory;
                    }
                }
            }
        },
        accessoryWithName: function (name, roomName) {
            for (let home of self.$homes().rawValue().map(el => el.runtimeValue())) {
                for (let accessory of home.$accessories().rawValue().map(el => el.runtimeValue())) {
                    if (accessory.$name().rawValue() === name && accessory.$room().$name().rawValue() === roomName) {
                        return accessory;
                    }
                }
            }
        },
        actionSetWithUUID: function (uuid) {
            for (let home of self.$homes().rawValue().map(el => el.runtimeValue())) {
                for (let actionSet of home.$actionSets().rawValue().map(el => el.runtimeValue())) {
                    if (actionSet.$uniqueIdentifier().$UUIDString().rawValue() === uuid) {
                        return actionSet;
                    }
                }
            }
        },
        actionSetWithName: function (name) {
            for (let home of self.$homes().rawValue().map(el => el.runtimeValue())) {
                for (let actionSet of home.$actionSets().rawValue().map(el => el.runtimeValue())) {
                    if (actionSet.$name().rawValue() === name) {
                        return actionSet;
                    }
                }
            }
        }
    }
});

let hv = HomeManager.$new();

function saveWorkspace() {
    $file.write({
        data: $data({ string: JSON.stringify($('deviceList').data[0].rows.map(el => ({ ...el, title: undefined, subTitle: undefined }))) }),
        path: FILE
    });
}