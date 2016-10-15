/**
 * Created by Oleg on 21/8/2016.
 */
'use strict';

//import $ from 'bower/jquery/dist/jquery';
import angular from 'npm/angular';
//import 'bower/slick-carousel/slick/slick.js';
import 'bower/angular-slick-carousel/dist/angular-slick.min';

import DoorsComponent from './door.component';
import DoorService from './door.service';

/*@ngInject*/
const root = angular.module('doorPhoto', ['slickCarousel'])
    .component('doors', DoorsComponent)
    .service('doorService', DoorService);

export default root;
