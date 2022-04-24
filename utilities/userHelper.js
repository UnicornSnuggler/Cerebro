exports.GetUser = async function(context, userId) {
    try {
        let user = await context.client.users.fetch(userId);

        return user ? user : null;
    }
    catch (e) {
        console.error(`An error occurred while attempting to retrieve a user...\n\n${e}`);
    }
}

exports.GetUserIdFromContext = function(context) {
    return context.user ? context.user.id : context.author ? context.author.id : context.member.id;
}