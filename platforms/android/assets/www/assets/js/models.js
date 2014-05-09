/**
 * Weekday object
 */
function Weekday(name, tasks) {
  this.name = name;
  this.tasks = tasks;
}

Weekday.prototype.addTask = function(task) {
  this.tasks.push(task);
}

Weekday.prototype.numTasks = function() {
  return this.tasks.length;
}

Weekday.prototype.hasTasks = function() {
  return (this.tasks.length > 0);
}

Weekday.prototype.clearTasks = function() {
  this.tasks = [];
}

/**
 * Task object
 */
function Task(description, completed) {
  this.description = description;
  this.completed = completed;
}