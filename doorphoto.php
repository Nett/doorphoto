<?php
/*
  Plugin Name: Door Photo
  Plugin URI:
  Description: Extends Door Catalog plugin (dependency Door Catalog plugin).
    Запуск:
        Из шаблона: <div><?php echo do_shortcode('[DoorPhotoSC]'); ?></div>
        Из конткнта страницы: [DoorPhotoSC]
  Version: 1677
  Author: Oleg_Malii
  Author URI:
  License: GPL2
 */

class DoorPhoto {

    private $_config = [];

    private $_tableName = 'door_catalog';

    public function renderDoorPhoto() {
        ;?>
        <div style="margin: 0 40px;" ng-app="doorPhoto">
            <doors></doors>
        </div>
    <?php
    }

    public function apiSwitch() {
        $this->_getConfig();
        global $wpdb;
        $this->_tableName =  $wpdb->prefix . $this->_tableName;
        $call = '_get' . ucfirst($_REQUEST['call']);
        ob_clean();
        echo json_encode($this->$call());
        die();
    }

    private function _getCategories() {
        global $wpdb;
        $query = "SELECT `category_id` as categoryId, COUNT(DISTINCT `name`) as itemsNumber FROM ". $this->_tableName ." WHERE `category_id` != 6 AND `category_id` != 7 GROUP BY `category_id`";
        $models = $wpdb->get_results($query, ARRAY_A);

        // Get models from folder
        if(in_array('6', $this->_config['category'])) {
            $folderModels = $this->_getFolderModels(6);
            if(!empty($folderModels['models'])) {
                $folderModel['categoryId'] = 6;
                $folderModel['itemsNumber'] = $folderModels['modelQty'];
                $models[] = $folderModel;
            }
        }
        if(in_array('7', $this->_config['category'])) {
            $folderModels = $this->_getFolderModels(7);
            if(!empty($folderModels['models'])) {
                $folderModel['categoryId'] = 7;
                $folderModel['itemsNumber'] = $folderModels['modelQty'];
                $models[] = $folderModel;
            }
        }

        foreach($models as $k => $model) {
            $models[$k]['name'] = ucfirst(array_search($model['categoryId'], $this->_config['category']));
        }

        return array(
            'categories' => $models,
            'newPhrase' => $this->_config['phrases']['new'],
            'uploadPhrase' =>$this->_config['phrases']['upload']
        );
    }

    private function _getColorsAndModels() {
        global $wpdb;
        if(intval($_GET['categoryId']) !== 6 && intval($_GET['categoryId']) !== 7) {
            $query = "SELECT DISTINCT color as id FROM " . $this->_tableName . " WHERE `category_id` = " . $_GET['categoryId'];
            $colors = $wpdb->get_results($query, ARRAY_A);
        }else {
            $colors = $this->_getFolderColors();
        }
        // Process color patterns for color slider
        foreach($colors as $k => $color) {
            foreach($this->_config['pattern'] as $pattern) {
                if($color['id'] === $pattern['id']) {
                    $colors[$k]['name'] = $pattern['name'];
                    $colors[$k]['image'] = plugin_dir_url('') . 'doorcatalog/images/patterns/' . $pattern['image'];
                }
            }
        }

        $colorId = $colors[0]['id'];
        $models = $this->_processModels($_GET['categoryId'], $colorId);

        return ['colors' => $colors, 'models' => $models, 'currentColorId' => $colorId];
    }

    private function _getModels() {
        return $this->_processModels(null, null);
    }

    private function _processModels($categoryId, $colorId) {
        if(!empty($_GET['categoryId'])) {
            $categoryId = $_GET['categoryId'];
        }
        if(!empty($_GET['colorId'])) {
            $colorId = $_GET['colorId'];
        }

        if(intval($categoryId) !== 6 && intval($categoryId) !== 7) {
            $models = $this->_queryModels($categoryId, $colorId);

            foreach($models as $k => $model) {
                $models[$k]['prefix'] = strtoupper($this->_config['prefix'][$model['categoryId']]);
                $models[$k]['image'] = get_option('siteurl') . '/wp-content/plugins/doorcatalog/images/doors/small/' . $model['image'];
            }
        }else {
            $models = $this->_getFolderModels($categoryId, $colorId);
        }

        return $models;
    }

    private function _queryModels($categoryId, $colorId) {
        global $wpdb;
        $where = 'category_id = ' . $categoryId . ' AND color = ' . $colorId;
        $query = "SELECT `id`, `category_id` as categoryId, `name`, `description`, `image`, `color`, `new` FROM " . $this->_tableName . " WHERE " . $where . " ORDER BY `name`";
        return $wpdb->get_results($query, ARRAY_A);
    }

    private function _getFolderModels($modelType = null, $colorId = null) {
        global $wpdb;
        $folderName = 'art';
        if($modelType === '7') {$folderName = 'glass';}

        $modelsDir = glob(dirname(__FILE__).'/../doorcatalog/' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR.'doors'.DIRECTORY_SEPARATOR.'original'.DIRECTORY_SEPARATOR . $folderName .DIRECTORY_SEPARATOR.'*.{jpg,png,gif}', GLOB_BRACE);

        $patterCategory = 6;
        $doorPatternType = ''; // $doorPatternType = 'border/';
        $handleFileName = 'handle';
        $searchCondition = '`category_id` = 6 AND `new` = 1';
        if($modelType === '7') {
            $handleFileName = 'handleG';
            $searchCondition = '`category_id` = 7 AND `new` = 1';
        }
        $query = "SELECT `name` FROM $this->_tableName where $searchCondition";
        $dataBaseModels = $wpdb->get_col($query);

        foreach($modelsDir as $k => $model) {
            $info = pathinfo($model);
            $modelParts = explode('-', $info['filename']);
            $selectedItems[$k] = array(
                'id' => $modelParts['1'] . $modelParts['0'],
                'categoryId' => $modelParts['0'],
                'image' =>  get_option('siteurl') . '/wp-content/plugins/doorcatalog/images/doors/original/' . $folderName.'/'.$info['basename'],
                'name' => $modelParts['1'],
                'prefix' => strtoupper($this->_config['prefix'][$modelParts['0']]),
                'handle' => get_option('siteurl') . '/wp-content/plugins/doorcatalog/images/sample/door/' . $handleFileName . '.png'
            );
            if($modelType === '7') {
                $selectedItems[$k]['hinge'] = get_option('siteurl') . '/wp-content/plugins/doorcatalog/images/sample/door/hinge.png';
            }
            if(!empty($colorId)) {
                $selectedItems[$k]['box'] = get_option('siteurl') . '/wp-content/plugins/doorcatalog/images/patterns/art/' . $doorPatternType . $patterCategory . '-' . $colorId . '.png';
            }
            if(!empty($dataBaseModels) && in_array($modelParts['1'], $dataBaseModels)) {
                $selectedItems[$k]['new'] = 1;
            }
        }

        if(!empty($colorId)) {
            return $selectedItems;
        }

        return array('models' => $selectedItems, 'modelQty' => count($selectedItems));
    }

    private function _getFolderColors() {
        $colorsDir = glob(dirname(__FILE__).'/../doorcatalog/' . DIRECTORY_SEPARATOR.'images'.DIRECTORY_SEPARATOR.'patterns'.DIRECTORY_SEPARATOR.'art'.DIRECTORY_SEPARATOR.'*.{jpg,png,gif}', GLOB_BRACE);
        foreach($colorsDir as $color) {
            $info = pathinfo($color);
            $colorParts = explode('-', $info['filename']);
            $colors[]['id'] = $colorParts['1'];
        }
        sort($colors);
        return $colors;
    }

    private function _getConfig() {
        $pathToConfig = dirname(__FILE__).'/../doorcatalog/config/catalog.ini';
        $configFile = parse_ini_file($pathToConfig, true);
        $categories = $configFile['category'];
        $pattern = $configFile['pattern'];
        $prefix = $configFile['prefix'];
        $phrases = $configFile['phrases'];
        $this->_config = array('category' => $categories, 'pattern' => $pattern, 'prefix' => $prefix, 'phrases' => $phrases);
    }

}

$DoorPhoto = new DoorPhoto();

add_action('wp_ajax_apiSwitch',array($DoorPhoto, 'apiSwitch'));
add_action('wp_ajax_nopriv_apiSwitch', array($DoorPhoto, 'apiSwitch'));

wp_deregister_script( 'jquery' );
wp_register_script( 'jquery', plugin_dir_url( __FILE__ ) . 'javascript/vendors/jquery1.7.1.js');
wp_enqueue_script( 'jquery' );

wp_deregister_script( 'slick.min' );
wp_register_script( 'slick.min', plugin_dir_url( __FILE__ ) . 'javascript/vendors/slick/slick.min.js');
wp_enqueue_script( 'slick.min' );

wp_deregister_script( 'exif' );
wp_register_script( 'exif', plugin_dir_url( __FILE__ ) . 'javascript/vendors/exif/exif.js');
wp_enqueue_script( 'exif' );


wp_enqueue_script('create-ajax-request_photo', plugin_dir_url( __FILE__ ) . 'javascript/dist/main.js', array());
// declare the URL to the file that handles the AJAX request (wp-admin/admin-ajax.php)
wp_localize_script( 'create-ajax-request_photo', 'ajaxLink', array( 'ajaxurl' => admin_url( 'admin-ajax.php' ) ) );


wp_register_style($handle = 'slick', $src = plugins_url('javascript/vendors/slick/slick.css', __FILE__), $deps = array(), $ver = '1.0.0', $media = 'all');
wp_enqueue_style('slick');

wp_register_style($handle = 'slick-theme', $src = plugins_url('javascript/vendors/slick/slick-theme.css', __FILE__), $deps = array(), $ver = '1.0.0', $media = 'all');
wp_enqueue_style('slick-theme');

wp_register_style($handle = 'doorphoto', $src = plugins_url('/css/doorCatalog.css', __FILE__), $deps = array(), $ver = '1.0.0', $media = 'all');
wp_enqueue_style('doorphoto');

wp_register_style($handle = 'googleIcon', $src = 'https://fonts.googleapis.com/icon?family=Material+Icons', $deps = array(), $ver = '1.0.0', $media = 'all');
wp_enqueue_style('googleIcon');

wp_register_style($handle = 'fontAwesome', $src = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.6.3/css/font-awesome.min.css', $deps = array(), $ver = '1.0.0', $media = 'all');
wp_enqueue_style('fontAwesome');

function doorPhotoShortCode($attributes){
    $DoorPhoto = new DoorPhoto();
    ob_start();
    $DoorPhoto->renderDoorPhoto();
    $output = ob_get_contents();
    ob_end_clean();
    return $output;
}

add_shortcode( 'DoorPhotoSC', 'doorPhotoShortCode' );