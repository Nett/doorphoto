/**
 * Created by Oleg on 24/8/2016.
 */
class DoorService {
    /*@ngInject*/
    constructor($http) {
        this.$http = $http;
        this.status = {};
    }

    getCategories() {
        return this.$http.get(ajaxLink.ajaxurl,
            {
                params: {
                    action: 'apiSwitch',
                    call: 'categories'
                },
                responseType: 'json'
            });
    }

    getColorsAndModels(categoryId) {
        return this.$http.get(ajaxLink.ajaxurl,
            {
                params: {
                    action: 'apiSwitch',
                    call: 'colorsAndModels',
                    categoryId: categoryId
                },
                responseType: 'json'
            });
    }

    getModels(categoryId, colorId) {
        return this.$http.get(ajaxLink.ajaxurl,
            {
                params: {
                    action: 'apiSwitch',
                    call: 'models',
                    categoryId: categoryId,
                    colorId: colorId
                },
                responseType: 'json'
            });
    }
}

export default DoorService;