/**
 * Created by Oleg on 22/8/2016.
 */
import DoorsController from './door.controller';

const DoorsComponent = {
    controller: DoorsController,
    templateUrl: require('!ngtemplate?requireAngular!html!./doors.html')/*,
    bindings: {
        courseData: '<'
    }*/
};

export default DoorsComponent;