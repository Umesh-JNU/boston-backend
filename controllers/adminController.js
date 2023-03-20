const orderModel = require("../models/orderModel");
const userModel = require("../models/userModel");
const catchAsyncError = require("../utils/catchAsyncError");

exports.getStatistics = catchAsyncError(async (req, res, next) => {
    const {time}=req.params;
    const date = new Date();
    date.setHours(24,0,0,0);
    const month = date.getMonth()+1;
const year =date.getFullYear()
    let startDate = new Date(date.getFullYear(), 0, 1);
    var days = Math.floor((date - startDate) /
        (24 * 60 * 60 * 1000));
    var week = Math.ceil(days / 7);     
   
        if(time=="daily") {
           
          
                const users = await userModel.aggregate([
                    {
                        $match: {
                            $expr: {
                              $gt: [
                                "$createdAt",
                                { $dateSubtract: { startDate: date, unit: "day", amount: 1 } }
                              ]
                            }
                        },
                        
                },
                {
                    $group: {
                      _id: null,
                      total: { $sum: 1 },
        
                    },
                  },
                
                   
                  ]);
                  const orders = await orderModel.aggregate([
                    {
                        $match: {
                            $expr: {
                              $gt: [
                                "$createdAt",
                                { $dateSubtract: { startDate: date, unit: "day", amount: 1 } }
                              ]
                            }
                        }
                },
                {
                    $group: {
                      _id: null,
                      total: { $sum: 1 },
        
                    },
                  },
                
                   
                  ]);
                  const payments = await orderModel.aggregate([
                    {
                        $match: {
                            $expr: {
                              $gt: [
                                "$createdAt",
                                { $dateSubtract: { startDate: date, unit: "day", amount: 1 } }
                              ]
                            }
                        }
                },
                {
                    $group: {
                      _id: null,
                      total: { $sum: "$amount" },
        
                    },
                  },
                
                   
                  ]);
                  const quantity = await orderModel.aggregate([
                    {
                        $match: {
                            $expr: {
                              $gt: [
                                "$createdAt",
                                { $dateSubtract: { startDate: date, unit: "day", amount: 1 } }
                              ]
                            }
                        }
                },
                {
                    $addFields:{
                        quantity:{$sum:"$products.quantity"}
                    }
                    
                },
                {
                    $group: {
                      _id: null,
                      total: { $sum: "$quantity" },
        
                    },
                  },
                
                   
                  ]);
                  const dailyUsers = await userModel.aggregate([
                    {
                        $match: {
                            $expr: {
                              $gt: [
                                "$createdAt",
                                { $dateSubtract: { startDate: date, unit: "day", amount: 6 } }
                              ]
                            }
                        }
                },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      const dailyOrders = await orderModel.aggregate([
        {
            $match: {
                $expr: {
                  $gt: [
                    "$createdAt",
                    { $dateSubtract: { startDate: date, unit: "day", amount: 6 } }
                  ]
                }
            }
    },
{
$group: {
_id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
total: { $sum: 1 },
},
},
{ $sort: { _id: 1 } },
]);
const dailyPayments = await orderModel.aggregate([
    {
        $match: {
            $expr: {
              $gt: [
                "$createdAt",
                { $dateSubtract: { startDate: date, unit: "day", amount: 6 } }
              ]
            }
        }
},
{
$group: {
_id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
total: { $sum: "$amount" },
},
},
{ $sort: { _id: 1 } },
]);
const dailyQuantity = await orderModel.aggregate([
    {
        $match: {
            $expr: {
              $gt: [
                "$createdAt",
                { $dateSubtract: { startDate: date, unit: "day", amount: 6 } }
              ]
            }
        }
},
{
    $addFields:{
        quantity:{$sum:"$products.quantity"}
    }
    
},
{
$group: {
_id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
total: { $sum: "$quantity" },
},
},
{ $sort: { _id: 1 } },
]);
                  return res.send({users:users,payments:payments,orders:orders,quantity:quantity,dailyUsers,dailyOrders,dailyPayments,dailyQuantity})
                
          
                
               

        }
        if(time=="weekly") {
           
          
          const users = await userModel.aggregate([
              {
                  $project:{
                      week:{$week:"$createdAt"},
                  
                  year:{$year:"$createdAt"}
                  }
              },
              {
                  $match: {
                      "year":year,
                     "week":week
                  },
                  
          },
          {
              $group: {
                _id: null,
                total: { $sum: 1 },
  
              },
            },
          
          
             
            ]);
            const payments = await orderModel.aggregate([
              {
                $project:{
                    week:{$week:"$createdAt"},
                
                year:{$year:"$createdAt"},
                amount:1
                }
            },
            {
                $match: {
                    "year":year,
                   "week":week
                },
                
        },
        {
            $group: {
              _id: null,
              total: { $sum: "$amount" },

            },
          },
        ])
          const orders = await orderModel.aggregate([
            {
              $project:{
                  week:{$week:"$createdAt"},
              
              year:{$year:"$createdAt"}
              }
          },
          {
              $match: {
                  "year":year,
                 "week":week
              },
              
      },
      {
          $group: {
            _id: null,
            total: { $sum: 1 },

          },
        },
          
             
            ]);
            const quantity = await orderModel.aggregate([
              {
                $project:{
                    week:{$week:"$createdAt"},
                
                year:{$year:"$createdAt"},
                quantity:{$sum:"$products.quantity"}
                }
            },
            {
                $match: {
                    "year":year,
                   "week":week
                },
                
        },
        {
            $group: {
              _id: null,
              total: { $sum: "$quantity" },

            },
          },
          
          
             
            ]);
            const dailyUsers = await userModel.aggregate([
              {
                  $project:{
                      week:{$week:"$createdAt"},
                  
                  year:{$year:"$createdAt"}
                  }
              },
              {
                  $match: {
                      "year":year,
                  
                  },
                  
          },
  {
    $group: {
      _id:  "$week" ,
      total: { $sum: 1 },
    },
  },
  { $sort: { _id: 1 } },
]);
const dailyOrders = await orderModel.aggregate([
  {
      $project:{
        week:{$week:"$createdAt"},
      
      year:{$year:"$createdAt"}
      }
  },
  {
      $match: {
          "year":year,
      
      },
      
},
{
$group: {
  _id:  "$week" ,
total: { $sum: 1 },
},
},
{ $sort: { _id: 1 } },
]);
const dailyQuantity = await orderModel.aggregate([
  {
      $project:{
        week:{$week:"$createdAt"},
      
      year:{$year:"$createdAt"},
      quantity:{$sum:"$products.quantity"}
      }
  },
  {
      $match: {
          "year":year,
      
      },
      
},
{
$group: {
  _id:  "$week" ,
total: { $sum: "quantity" },
},
},
{ $sort: { _id: 1 } },
]);
const dailyPayments = await orderModel.aggregate([
  {
      $project:{
          week:{$week:"$createdAt"},
      
      year:{$year:"$createdAt"},
      amount:1
      }
  },
  {
      $match: {
          "year":year,
      
      },
      
},
{
$group: {
  _id:  "$week" ,
total: { $sum: "$amount" },
},
},
{ $sort: { _id: 1 } },
]);
            return res.send({users:users,payments:payments,orders:orders,quantity:quantity,dailyUsers,dailyOrders,dailyQuantity,dailyPayments})
          


  }
        if(time=="monthly") {
           
          
            const users = await userModel.aggregate([
                {
                    $project:{
                        month:{$month:"$createdAt"},
                    
                    year:{$year:"$createdAt"}
                    }
                },
                {
                    $match: {
                        "year":year,
                       "month":month
                    },
                    
            },
            {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
    
                },
              },
            
            
               
              ]);
              const orders = await orderModel.aggregate([
                {
                    $project:{
                        month:{$month:"$createdAt"},
                    
                    year:{$year:"$createdAt"}
                    }
                },
                {
                    $match: {
                        "year":year,
                       "month":month
                    },
                    
            },
            {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
    
                },
              },
            
            
               
              ]);
              const payments = await orderModel.aggregate([
                {
                    $project:{
                        month:{$month:"$createdAt"},
                    
                    year:{$year:"$createdAt"},
                    amount:1
                    }
                },
                {
                    $match: {
                        "year":year,
                       "month":month
                    },
                    
            },
            {
                $group: {
                  _id: null,
                  total: { $sum: "$amount" },
    
                },
              },
            
               
              ]);
              const quantity = await orderModel.aggregate([
                {
                    $project:{
                        month:{$month:"$createdAt"},
                    
                    year:{$year:"$createdAt"},
                    quantity:{$sum:"$products.quantity"}
                    }
                },
                {
                    $match: {
                        "year":year,
                       "month":month
                    },
                    
            },
            {
                $group: {
                  _id: null,
                  total: { $sum: "$quantity" },
    
                },
              },
            
            
               
              ]);
              const dailyUsers = await userModel.aggregate([
                {
                    $project:{
                        month:{$month:"$createdAt"},
                    
                    year:{$year:"$createdAt"}
                    }
                },
                {
                    $match: {
                        "year":year,
                    
                    },
                    
            },
    {
      $group: {
        _id:  "$month" ,
        total: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const dailyOrders = await orderModel.aggregate([
    {
        $project:{
            month:{$month:"$createdAt"},
        
        year:{$year:"$createdAt"}
        }
    },
    {
        $match: {
            "year":year,
        
        },
        
},
{
$group: {
_id:  "$month" ,
total: { $sum: 1 },
},
},
{ $sort: { _id: 1 } },
]);
const dailyQuantity = await orderModel.aggregate([
    {
        $project:{
            month:{$month:"$createdAt"},
        
        year:{$year:"$createdAt"},
        quantity:{$sum:"$products.quantity"}
        }
    },
    {
        $match: {
            "year":year,
        
        },
        
},
{
$group: {
_id:  "$month" ,
total: { $sum: "$quantity" },
},
},
{ $sort: { _id: 1 } },
]);
const dailyPayments = await orderModel.aggregate([
    {
        $project:{
            month:{$month:"$createdAt"},
        
        year:{$year:"$createdAt"},
        amount:1
        }
    },
    {
        $match: {
            "year":year,
        
        },
        
},
{
$group: {
_id:  "$month" ,
total: { $sum: "$amount" },
},
},
{ $sort: { _id: 1 } },
]);
              return res.send({users:users,payments:payments,orders:orders,quantity:quantity,dailyUsers,dailyOrders,dailyQuantity,dailyPayments})
            
    } 
  });