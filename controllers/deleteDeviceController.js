//deleteDeviceController.js

const Device = require('../models/devices');

exports.deleteDevice = async function(req, res) {
    try{
        const deviceId = req.params.id;

        //Delete the device by ID
        const deletedId = await Device.findByIdAndDelete(deviceId);

        console.log(deletedId);

        //Redirect to the devicelis page after successful deletion
        res.redirect('/devicelist');
    }catch(error){
        console.error(error);
        res.status(500).json({error: 'Internal server error'});
    }
}