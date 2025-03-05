resource "aws_sqs_queue" "order_queue" {
  name = "order-sqs-queue"
}

resource "aws_sqs_queue" "order_queue_dlq" {
  name = "order-sqs-queue-dlq"
}