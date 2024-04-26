const Version = require('../../models/versionModel')

module.exports.changeVersion = async(req,res)=>{
    try{
        const {version,os}=req.body
        const versionOndb = await Version.findOne({version,os})
        if(versionOndb){
            versionOndb.version = version
            await versionOndb.save()
            return res.send({status:'success',message:'version changed'})
        }
        const newVersion = await Version.create({version,os})
        res.send({status:'success',message:'version created'})
    }
    catch(e){
        res.send({status:'fail',status:"Version didn't change"})
    }
}

module.exports.getVersion=async(req,res)=>{
    try{
        const {os}=req.query
        const versionOnDb = await Version.findOne({os}).sort({createdAt:-1}).select('version os -_id')
        if(versionOnDb){
            return res.send({status:'success',data:versionOnDb})
        }
        res.send({status:'fail',data:'',message:'version not found'})
    }
    catch(e){
        res.send({status:'fail',message:'version not found'})
    }

}