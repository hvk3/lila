package lila.coach

import play.api.libs.json._

case class JsonQuestion(
    dimension: String,
    metric: String,
    filters: Map[String, List[String]]) {

  def question: Option[Question[_]] = {
    import Dimension._
    for {
      realMetric <- Metric.byKey get metric
      realFilters = filters.map {
        case (filterKey, valueKeys) => {
          def build[X](dimension: Dimension[X]) = Filter[X](dimension, valueKeys.flatMap { Dimension.valueByKey(dimension, _) }).some
          filterKey.pp match {
            case Perf.key             => build(Perf)
            case Phase.key            => build(Phase)
            case Result.key           => build(Result)
            case Color.key            => build(Color)
            case Opening.key          => build(Opening)
            case OpponentStrength.key => build(OpponentStrength)
            case PieceRole.key        => build(PieceRole)
            case _                    => none
          }
        }.pp
      }.flatten.filterNot(_.isEmpty).toList
      question <- {
        def build[X](dimension: Dimension[X]) = Question[X](dimension, realMetric, realFilters).some
        dimension match {
          case Perf.key             => build(Perf)
          case Phase.key            => build(Phase)
          case Result.key           => build(Result)
          case Color.key            => build(Color)
          case Opening.key          => build(Opening)
          case OpponentStrength.key => build(OpponentStrength)
          case PieceRole.key        => build(PieceRole)
          case _                    => none
        }
      }
    } yield question
  }
}

object JsonQuestion {

  implicit val QuestionReads = Json.reads[JsonQuestion]
}