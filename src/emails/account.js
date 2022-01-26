const sgMail =require('@sendgrid/mail');

sgMail.setApiKey(process.env.sendgridAPIKey);

const sendWelcomeEmail= (email,name)=>{
    sgMail.send({
        to:email,
        from:'oferd90@gmail.com',
        subject:'Thanks for joining in!',
        text:`Welcome to the app, ${name}. Let me know how you get along with the app`
    })
}

module.exports = {sendWelcomeEmail}