output "sqs_queue_arn" {
  value = aws_sqs_queue.order_queue.arn
}