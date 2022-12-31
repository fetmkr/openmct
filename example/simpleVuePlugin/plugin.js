import Vue from 'vue';
import HelloWorld from './HelloWorld.vue';

function SimpleVuePlugin() {
    return function install(openmct) {
        openmct.types.addType('hello-world', {
            name: 'Test Vue',
            description: 'An introduction object',
            cssClass: 'icon-packet',
            creatable: true
        });
        openmct.objectViews.addProvider({
            name: "demo-provider",
            key: "hello-world",
            cssClass: "icon-packet",
            canView: function (d) {
                return d.type === 'hello-world';
            },
            view: function (domainObject) {
                var vm;

                return {
                    show: function (container) {
                        vm = new Vue(HelloWorld);
                        container.appendChild(vm.$mount().$el);
                    },
                    destroy: function (container) {
                        vm.$destroy();
                    }
                };
            }
        });

    };
}

export default SimpleVuePlugin;
