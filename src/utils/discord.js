module.exports.getMembers = interaction => interaction.guild.members.fetch();

module.exports.getMember = (interaction, userId) => this.getMembers(interaction)
  .then(members => members.find(member => member.user.id === userId)?.fetch());

module.exports.getMemberName = (interaction, userId) => this.getMember(interaction, userId)
  .then(member => member?.displayName ?? '\u200B');
